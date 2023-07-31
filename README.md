# Subscription Bound Account · SBA
Subscription Bound Accounts (SBA) are the ultimate solution to create smart contract accounts bound to subscriptions paid every second powered by Superfluid's Constant Flows Agreements (CFA) on the Celo blockchain.

SBAs allows any platform on the Celo blockchain to on board their users trough subscriptions that include the ability to mint some credits (ERC20) to the user based on the amount of super tokens being streamed. These features allow flexible tiers based subscriptions with an smooth on boarding.

## Smooth on boarding with SBA
- An user clicks the subscribe button, then the Superfluid Widget will appear.
- The user selects a tier (amount to be streamed) and the payment options*.

  **Currently the user can choose between tier 1 (1 token / year) and tier 42 (42 token / year) and make the payment with GoodDollar or CELOx.*
- The user starts the streaming of the desired super token signing and sending a transaction to the Celo blockchain.
- The user receives an SBA funded with 1 or 42 credits (depending on the tier selected) ready to use in the platform.

## The SBAMagic revealed
Under the hood, our SBA Manager smart contract (SBAM) takes care of everything. The SBAM itself is a SuperApp and an ERC20 token that has the ability to call an
ERC6551Registry and create Token Bound Accounts (TBAs). These TBAs are bound to the OutflowNFT* that is minted whenever every CFA starts and destroyed after ends the CFA.
This way we can ensure that the user is only able to access their SBA while he/she continues streaming to the SBAM aka being a subscriptor. 
After cancel an stream, any user may recover access to their SBA just starting a new stream.

**Since GoodDollar does not implement the CIF/COF NFTs, we have deployed a custom one that is called from the SBAM leveraging SuperApp callbacks*

## SBA actions
Currently our SBAs are able to make any kind of call trough the executeCall function since they are compliant with the ERC6551.
We are providing the next ready to use functions:
- Mint an NFT (J. Valeska on Celo collection)
- Buy more credits (1 G$ == 1 credit, 1 CELOx == 1 credit)*
- Spend some credits (test function that burns some tokens)
- Upgrade / downgrade subscription tier (trough widget).

**GoodDollar and Celo prices are not equivalent, we are using these prices for testing purposes*

## About the backend folder
This folder includes our contracts and some config files like the Hardhat one but all our smart contracts has been deployed using Remix.
## About the fronted folder
This folder contains our dapp. Our dapp allows anyone to call our SBAM and create SBAs trough the Superfluid subscription widget on the Celo blockhain.

## Contracts and importants links

- SBA controlled by Deployer EOA (42 G$): 0xB2E65F8F38097Ca2c0C355D0c1F9312eC62A7731
- SBA controlled by Deployer EOA (42 CELOx): 0x7BA196C575B02734504b21b8dD4260634974A211
- SBAM (G$): 0x1dF2013adCadFab51D7233547c78331f23B03e04
- SBAM (CELOx): 0x7Dc01c36d8fd3e8104f818091D90F74710AEac2f
- Outflow NFT (G$): 0xc09c8d5c1f1325ed2d33b1153dc75edf76f080e7
- ERC6551 Registry: 0x34e1408B9B047fE12a1B0C655B2D58775AcF579A
- SBA implementation: 0x8f8574060f3682408d75a7Fbc86e8e51bc806Fc8
- J. Valeska on Celo NFT collection: 0x6008dBE25d0a7fC93eD0D514a878d2dE98d0b5D2
- Deployer EOA: 0xc392302FfF674EF5c2c3DD59210eC0FeDd4D2acf
- J. Valeska on Celo NFT collection on TofuNFT: https://tofunft.com/nft/celo/0x6008dBE25d0a7fC93eD0D514a878d2dE98d0b5D2/4

## Contributions && Development
- Clone the repository:
```
git clone https://github.com/jvaleskadevs/sba.git
```
- Install dependencies:
```
cd frontend && npm install
```
- Add .env variables:
```
NEXT_PUBLIC_TAT=<your_tatum_api_key>
NEXT_PUBLIC_WC=<your_wallet_connect_project_id>
```
- Run the dapp:
```
npm run dev
```

