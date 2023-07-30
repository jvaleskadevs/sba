import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const body = await req.json();
  console.log(body);
	const { metadataUri } = body;
	
	if (req.method !== 'POST') {
		return new Response({status: 500, message: 'Only POST method allowed'});
	}

  try {
    const resp = await fetch(metadataUri, {
        method: 'GET'
      }
    );

    const data = await resp.json();
    console.log(data.value);

		return NextResponse.json({
			metadata: data.value
		});
  } catch (err) {
    console.warn(err);
    return new Response({status: 500, message: err.message});
  }
}
