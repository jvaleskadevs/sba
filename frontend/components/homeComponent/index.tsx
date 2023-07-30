import { useMemo, useState, useEffect } from "react";
import Image from 'next/image';
import SuperfluidWidget from "@superfluid-finance/widget";
import superTokenList from "@superfluid-finance/tokenlist";
import { ethers } from "ethers";
import { useAccount, useWalletClient } from "wagmi";
import { useModal } from "connectkit";
import { paymentOptions, paymentDetails, productDetails } from './paymentInfo';
import { ERC6551RegistryABI } from "../../artifacts/ERC6551RegistryABI";
import { SBAABI } from "../../artifacts/SBAABI";
import { SBAManagerABI } from "../../artifacts/SBAManagerABI";
import styles from "./homeComponent.module.css";

export default function HomeComponent() {
  const [SBA, setSBA] = useState<string>('');
  const [outflow, setOutflow] = useState<any|null>(null);
  const [creditsBalance, setCreditsBalance] = useState<string>('0');
  const { data: walletClient } = useWalletClient();
  const { address } = useAccount();
  const { open, setOpen } = useModal();
  
  const walletManager = useMemo(() => ({
    isOpen: open,
    open: setOpen
  }), [open, setOpen]); 

  const fetchNfts = async () => {
    const endpoint = 'api/nfts';
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        body: JSON.stringify({
          address
        })
      }).then(res => res.json());
      
      console.log(res);
      
      if (res.nfts) {
        let outflow;
        for (let i = 0; i < res.nfts.length; i++) {
          // check nft is a superfluid outflowNFT or our custom one for goodDollar
          if (res.nfts[i][0].contract === "0xbe49ac1eadac65dccf204d4df81d650b50122ab2" ||
            res.nfts[i][0].contract === "0xc09c8d5c1f1325ed2d33b1153dc75edf76f080e7") {
            // It is an outflowNFT, so we get metadata to validate the subscription
            console.log(res.nfts[i][0]);
            
            let metadata = 'N/A';
            if (res.nfts[i][0].media !== 'N/A') {
              metadata = (await fetch('api/metadataparsed', {
                method: 'POST',
                body: JSON.stringify({
                  metadataUri: res.nfts[i][0].media
                })
              }).then(res => res.json())).metadata
            }
            
            outflow = { 
              ...res.nfts[i][0],
              metadata: metadata
            };
            
            console.log(outflow);
            
            // Subscription validation
            // the outflowNFT must match our dapp requirements
            if (outflow.metadata.sender // the user
              === address?.toLowerCase() &&
                outflow.metadata.receiver // the dapp
                  === "0x7dc01c36d8fd3e8104f818091d90f74710aeac2f" && 
                    outflow.metadata.chain_id // Celo chainId
                      === "42220" && 
                        outflow.metadata.outgoing // isOutgoingFlow?
                          === "true" &&
                            outflow.metadata.token_address // CELOx address
                              === "0x671425ae1f272bc6f79bec3ed5c4b00e9c628240" && 
                                outflow.metadata.token_symbol // CELOx symbol
                                  === "CELOx" &&
                                    outflow.metadata.flowRate as number // minFlowRate
                                      >= 31709791983) {
              // it is our Superfluid subscription outflow nft
              console.log('outflow-subscription');
              console.log(outflow);                                       
              setOutflow(outflow); 
            } else if (outflow.tokenId === BigInt(ethers.utils.solidityKeccak256(
              ["address", "address"],
              [address, "0x1dF2013adCadFab51D7233547c78331f23B03e04"]
            )).toString()) {
              // it is our goodDollar subscription custom outflow nft
              console.log('outflow-subscription-g');
              outflow.metadata = { 
                token_address: "0x62b8b11039fcfe5ab0c56e502b1c372a3d2a9c7a"
              };
              console.log(outflow);
              setOutflow(outflow);               
            }else {
              setOutflow(null);
            }
          }
        }     
      }
    } catch (err) {
      console.log(err);
    }
    return [];
  }

  const fetchSBA = async () => {
    if (!outflow || SBA) return;
    
    try { 
      const ERC6551Registry = 
        "0x34e1408B9B047fE12a1B0C655B2D58775AcF579A";
      const provider = new ethers.providers.Web3Provider((window as any).ethereum);
      const signer = await provider.getSigner();
      const ercRegistry6551 = new ethers.Contract(
        ERC6551Registry, ERC6551RegistryABI, signer
      );
      const SBAImpl =
        "0x8f8574060f3682408d75a7Fbc86e8e51bc806Fc8";
      
      const accountAddress = await ercRegistry6551.account(
        SBAImpl, // SBAccount implementation
        42220, // Celo chainId
        outflow.contract, // constantOutFlowNFT contract address
        outflow.tokenId, // constantOutFlowNFT tokenId
        0 // random salt
      );  
      
      console.log(`Subscription Bound Account found at:\n${accountAddress}`);
      
      const SBAManagerAddress = outflow.metadata.token_symbol === 'CELOx' 
        ? "0x7Dc01c36d8fd3e8104f818091D90F74710AEac2f"  // CELOx SBAM
        : "0x1dF2013adCadFab51D7233547c78331f23B03e04"; // G$ SBAM
      const SBAManager = new ethers.Contract(
        SBAManagerAddress, SBAManagerABI, signer
      );
      console.log(`Balance:\n${SBAManagerAddress}`);
      const balance = await SBAManager.balanceOf(accountAddress);
      console.log(`Balance:\n${balance}`);
      
      setSBA(accountAddress);
      setCreditsBalance(
        ethers.utils.formatEther(
          balance.toString()
        ).toString().slice(0, -2)
      );
    } catch (err) {
      console.log(err);
    }
  }

  const executeCall = async () => {
    if (!SBA) return;

    const NFT_MINTABLE = // J. Valeska NFT Collection
      "0x6008dBE25d0a7fC93eD0D514a878d2dE98d0b5D2";
    const nftMintableIface = getNftMintableInterface(); 
    const provider = new ethers.providers.Web3Provider((window as any).ethereum);
    const signer = await provider.getSigner();
    const sba = new ethers.Contract(
      SBA, SBAABI, signer
    );

    try {
      const tx = await sba.executeCall(
        NFT_MINTABLE, // to
        0n,         // value
        nftMintableIface.encodeFunctionData(
          "safeMint",
          [sba.address],
          0n
        ) // calldata
      );
      
      console.log(tx);
      console.log(`J. Valeska NFT minted to:\n${sba.address}`);
    } catch (err) {
      console.log(err);
    }
  }
  
  const getNftMintableInterface = () => {
    const ERC721MintableABI = ["function safeMint(address to) public"];
    return new ethers.utils.Interface(ERC721MintableABI);
  }
  
  
  const buyMoreCredits = async () => {
    if (!SBA) return;

    const provider = new ethers.providers.Web3Provider((window as any).ethereum);
    const signer = await provider.getSigner();
    const SBAManagerAddress = outflow.metadata?.token_symbol === 'CELOx' 
      ? "0x7Dc01c36d8fd3e8104f818091D90F74710AEac2f"  // CELOx SBAM
      : "0x1dF2013adCadFab51D7233547c78331f23B03e04"; // G$ SBAM

    const approvalABI = ["function approve(address sender, uint256 amount) external"];
    const superToken = new ethers.Contract(
      outflow.metadata.token_address, approvalABI, signer
    );

    try {
      const tx = await superToken.approve(
        SBAManagerAddress,
        ethers.utils.parseEther('1') // amount
      );
      
      console.log(tx);
      console.log(`Supertoken allowance Increased for ${SBAManagerAddress}`);
    } catch (err) {
      console.log(err);
    }    
    
    const SBAManager = new ethers.Contract(
      SBAManagerAddress, SBAManagerABI, signer
    );

    try {
      const tx = await SBAManager.buyMoreCredits(
        SBA,
        ethers.utils.parseEther('1') // amount
      );
      
      console.log(tx);
      console.log(`1 credit bought for ${SBA}`);
      setOutflow({ ...outflow }); // this triggers the useEffect for fetchSBA again
    } catch (err) {
      console.log(err);
    }  
  }
  
  const spendSomeCredits = async () => {
    if (!SBA) return;

    const provider = new ethers.providers.Web3Provider((window as any).ethereum);
    const signer = await provider.getSigner();
    const sba = new ethers.Contract(
      SBA, SBAABI, signer
    );

    const SBAManagerAddress = outflow.metadata.token_symbol === 'CELOx' 
      ? "0x7Dc01c36d8fd3e8104f818091D90F74710AEac2f"  // CELOx SBAM
      : "0x1dF2013adCadFab51D7233547c78331f23B03e04"; // G$ SBAM
    const SBAManagerIface = new ethers.utils.Interface(SBAManagerABI);
    
    try {
      const tx = await sba.executeCall(
        SBAManagerAddress, // to
        0n,         // value
        SBAManagerIface.encodeFunctionData(
          "spendSomeCredits",
          [ethers.utils.parseEther('1')],
          0n
        ) // calldata
      );
      
      console.log(tx);
      console.log(`${sba.address} permormed action $action. Cost: 1 credit`);
      setOutflow({ ...outflow }); // this triggers the useEffect for fetchSBA again
    } catch (err) {
      console.log(err);
    }  
  }
  
  useEffect(() => {
    if (walletClient) fetchNfts();
  }, [walletClient]);  
    
  const onSubscription = async () => {
    // fetching nfts again to fetch the outflowNFT to bound accounts to
    await fetchNfts();
  }
  
  useEffect(() => {
    if (outflow) fetchSBA();
  }, [outflow]);

/*
  // Manually creating an SBAccount
  const createAccount = async () => {
    if (!outflow || SBA) return;
    
    const ERC6551Registry = 
      "0x34e1408B9B047fE12a1B0C655B2D58775AcF579A";
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = await provider.getSigner();
    const ercRegistry6551 = new ethers.Contract(
      ERC6551Registry, ERC6551RegistryABI, signer
    );
    
    const SBAImpl =
      "0x8f8574060f3682408d75a7Fbc86e8e51bc806Fc8";
    // flowRate may be used to create different accounts based on tiers. Ex:
    // Optional ------------------------
      let SBAImpl;
      switch (outflow.metadata.flowRate) {
        // Subscription tier 42
        case '1331811263318':
          SBAImpl = "0x8f85...6Fc8";
          break;
        // Subscription tier 1
        case '1':
          SBAImpl = "0x2bb6...cd1a";
          break;
        // No Subscription, theoretically unreachable code
        default:
          return;
      }
    // ------------------------- 

    // Create account bound to the constantOutFlowNFT
    try {
      const tx = await ercRegistry6551.createAccount(
        SBAImpl, // SBAccount implementation
        42220, // Celo chainId
        outflow.contract, // constantOutFlowNFT contract address
        outflow.tokenId, // constantOutFlowNFT tokenId
        0, // random salt
        "0x" // initData
      );
      console.log(tx);
      
      const accountAddress = await ercRegistry6551.account(
        SBAImpl, // SBAccount implementation
        42220, // Celo chainId
        outflow.contract, // constantOutFlowNFT contract address
        outflow.tokenId, // constantOutFlowNFT tokenId
        0 // random salt
      );
      
      console.log(`Subscription Bound Account created at:\n${accountAddress}`);
      setSBA(accountAddress);
    } catch (err) {
      console.log(err);
      console.log(`SBA creation failed`);
    }    
  }
*/
 
  return (
    <div className={styles.container}>
      <header className={styles.header_container}>
        <div className={styles.header}>
          <h1>
            subscription<span>-bound-accounts</span>
          </h1>
          <h3>The ultimate solution to create Subscription Bound Accounts</h3>
        </div>
      </header>
      
      { outflow && // the user has an SBA active
        <div className={styles.get_started}>
          <p>Your Subscription Bound Account: <span>{SBA}</span></p>
          <br></br>
          <div>
            <p>Your Dapp Credits Balance: <span>{creditsBalance}</span>
              <a href={`https://celoscan.io/address/${SBA}`} target="_blank" rel="noopener noreferrer">
                <Image 
                  priority 
                  src="link.svg" 
                  width="18" 
                  height="18" 
                  alt="see account on block explorer"
                  className={styles.link_icon}
                />
              </a>
            </p>
          </div>
        </div>
      }

      <div className={styles.buttons_container}>
        <SuperfluidWidget
          productDetails={productDetails}
          paymentDetails={paymentDetails}
          tokenList={superTokenList}
          type="drawer"
          walletManager={walletManager}

          eventListeners={{
            //onSuccessButtonClick: onSuccessClickCallback,
            onSuccess: () => onSubscription(),
          }}

        >
          {({ openModal }) => (
            <div className={styles.buttons_container}> 
              <div onClick={() => openModal()} className={styles.button}>
                <p>{outflow ? "Edit Subscription" : "Subscribe"}</p>
              </div>
            </div>
          )}
        </SuperfluidWidget>
{/*
        { !outflow && // a new user with no SBA
          <div onClick={createAccount} className={styles.button}>
            <p>Create SBA</p>
          </div>
        }
*/}        
        { outflow && // the user has an SBA active
          <div className={styles.buttons_container}> 
            <div onClick={spendSomeCredits} className={styles.button}>
              <p>Spend some Credits</p>
            </div>
            <div onClick={buyMoreCredits} className={styles.button}>
              <p>Buy more Credits</p>
            </div>
            <div onClick={executeCall} className={styles.button}>
              <p>Mint J.Valeska NFT with SBA</p>
            </div> 
          </div>       
        }
      </div>
        <div>
          <p className={styles.get_started}>
            <br></br>
          </p>
        </div> 
    </div>
  );
}
