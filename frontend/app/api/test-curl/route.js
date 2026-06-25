import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { stdout, stderr } = await execAsync(
      '/usr/bin/curl -v -s -L --connect-timeout 10 -m 25 "https://www.tgju.org/currency"',
      { env: { ...process.env, HTTP_PROXY: "", HTTPS_PROXY: "", ALL_PROXY: "", http_proxy: "", https_proxy: "", all_proxy: "" } }
    );
    return NextResponse.json({ success: true, length: stdout.length, stderr });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message, stack: err.stack });
  }
}
