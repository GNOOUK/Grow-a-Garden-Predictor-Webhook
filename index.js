const puppeteer = require("puppeteer");
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));
const FormData = require("form-data");
const webhooks = require("./webhooks.json");

const URL = "https://luminon.top/gag2/";

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function captureShop(tabButtonId, label) {
    const browser = await puppeteer.launch({
        headless: true,
        executablePath: puppeteer.executablePath(), // IMPORTANT POUR PTERODACTYL
        args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-gpu"
        ]
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1800, height: 1000 });

    await page.goto(URL, { waitUntil: "networkidle2" });

    // Clique sur l’onglet
    await page.waitForSelector(`#${tabButtonId}`);
    await page.click(`#${tabButtonId}`);

    // Pause universelle compatible
    await sleep(800);

    // Capture uniquement le bloc shop
    const element = await page.$(".shop");
    const buffer = await element.screenshot();

    await browser.close();
    return buffer;
}

async function sendImage(webhookURL, imageBuffer, label) {
    const form = new FormData();
    form.append("file", imageBuffer, `${label}.png`);
    form.append("content", `${label} :`);

    await fetch(webhookURL, {
        method: "POST",
        body: form
    });
}

async function run() {
    console.log("📸 Capture SEED…");
    const seedImg = await captureShop("tabSeeds", "Seed");
    await sendImage(webhooks.seeds, seedImg, "Seed");

    console.log("📸 Capture GEAR…");
    const gearImg = await captureShop("tabGears", "Gear");
    await sendImage(webhooks.gear, gearImg, "Gear");

    console.log("📸 Capture WEATHER…");
    const weatherImg = await captureShop("tabWeather", "Weather");
    await sendImage(webhooks.weather, weatherImg, "Weather");

    console.log("✔️ Toutes les captures envoyées !");
}

run();
setInterval(run, 5 * 60 * 1000);
