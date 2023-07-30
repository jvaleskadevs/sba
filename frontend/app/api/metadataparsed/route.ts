import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const body = await req.json();
  console.log(body);
	const { metadataUri } = body;
	
	if (req.method !== 'POST') {
		return NextResponse.json({ error: 'Only POST method allowed' }, { status: 500 })
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
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
