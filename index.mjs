import { PlaywrightCrawler, Dataset } from "crawlee";

const HOST = "https://doctorphone.de";

const crawler = new PlaywrightCrawler({
  requestHandler: async ({ page, request, enqueueLinks }) => {
    if (request.label === "DETAIL") {
      const name = await page.locator("#phoneTypeTitle").textContent();
      const brand = await page.locator("#brandChozen").textContent();
      const image = await page.isVisible(".hotspot-img");
      const services = await page
        .locator("#reparatie_lijst > li > a")
        .allInnerTexts();

      const results = {
        name,
        brand,
        image: image
          ? `${HOST}/${await page.locator(".hotspot-img").getAttribute("src")}`
          : "",
        url: request.url,
        services: services.map((service) => {
          const text = service.split("\n");
          if (text.length < 2 && text[0].includes("€")) {
            return {
              name: "",
              value: text[0]?.trim(),
            };
          }
          return {
            name: text[0]?.trim(),
            value: text[1]?.trim(),
          };
        }),
      };

      await Dataset.pushData(results);
    } else if (request.label === "CATEGORY") {
      const products = await page.isVisible(".model-list > li > a");
      if (products) {
        await enqueueLinks({
          selector: ".model-list > li > a",
          label: "DETAIL",
        });
      }
    } else {
      await page.waitForSelector(".brand-select");
      await enqueueLinks({
        selector: ".brand-select",
        label: "CATEGORY",
      });
    }
  },
});

await crawler.run(["https://doctorphone.de/reparatur"]);
