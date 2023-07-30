import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const body = await req.json();
  console.log(body);
	const { address } = body;
	
	if (req.method !== 'POST') {
		return NextResponse.json({ error: 'Only POST method allowed' }, { status: 500 })
	}
	
	
  //const testAddressFromCeloExplorer = "0xEa21171f79a19338bF608ffa1c64dE0B33F0Ab19";
  try {
    const requestHeaders: HeadersInit = new Headers();
    requestHeaders.set('x-api-key', process.env.NEXT_PUBLIC_TAT);
    const resp = await fetch(
      `https://api.tatum.io/v3/nft/address/balance/CELO/${address}`,
      {
        method: 'GET',
        headers: requestHeaders
      }
    );

    const data = await resp.json();
    console.log(data);

		const formattedNfts = data.map((nft) => {
			return nft.metadata.map((meta) => {
			  console.log(meta);
			  return {
				  contract: nft.contractAddress,
				  tokenId: meta.tokenId,
				  title: meta.name,
				  desc: meta.description,
				  media: meta.url ?? "https://via.placeholder.com/500"
			  };			  
			})
		});
		
		console.log(...formattedNfts);

		return NextResponse.json({
			nfts: [...formattedNfts]
		});
  } catch (err) {
    console.warn(err);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
