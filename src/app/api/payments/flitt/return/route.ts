/**
 * Flitt კლიენტს response_url-ზე POST-ით (ფორმით) აბრუნებს — გვერდი POST-ს ვერ იღებს (405),
 * ამიტომ აქ ვიღებთ და 303-ით გადავამისამართებთ შედეგის გვერდზე (სტატუსს ის თავად ამოწმებს Flitt-ში).
 */
function handle(request: Request) {
  const url = new URL(request.url);
  const order = (url.searchParams.get("order") ?? "").slice(0, 40);
  const prefix = url.searchParams.get("lang") === "en" ? "/en" : "";
  return Response.redirect(new URL(`${prefix}/checkout/result?order=${encodeURIComponent(order)}`, url.origin), 303);
}

export const POST = handle;
export const GET = handle;
