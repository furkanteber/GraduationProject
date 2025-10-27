import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import FormData from "@/models/FormData";

export const runtime = "nodejs"; 
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const data = await req.json();

    if (!data?.name || !data?.email || !data?.job) {
      return NextResponse.json(
        { success: false, error: "İsim, email ve meslek zorunludur." },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const created = await FormData.create(data);

    return NextResponse.json({ success: true, id: created._id });
  } catch (err: any) {
    console.error("API /api/form POST error:", err);

    const msg =
      err?.message ||
      err?.toString?.() ||
      "Bilinmeyen sunucu hatası.";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
