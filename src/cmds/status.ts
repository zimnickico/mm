import { Resend } from "resend";
import { readStore } from "../utils/store";
import { red, reset } from "../utils/styles";

export async function status(resend: Resend, md: string) {
  const store = readStore(md);
  if (!store?.id) {
    console.log("No local broadcast found for this file.");
    return;
  }
  const { data, error } = await resend.broadcasts.get(store.id);
  if (error) {
    console.error(`${red}(Error)${reset} `, error);
    process.exit(1);
  }
  console.log(JSON.stringify({ local: store, remote: data }, null, 2));
}
