import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import { allCards } from "./share-catalog.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const bold = readFileSync(join(root, "scripts/fonts/Heebo-Bold.ttf"));
const medium = readFileSync(join(root, "scripts/fonts/Heebo-Medium.ttf"));
const outRoot = join(root, "public/og");

const ACCENT = {
  home: "#1c4a3c",
  food: "#c45c3e",
  sos: "#3a1f1c",
  app: "#2f6b56",
  place: "#1c4a3c",
};

function el(type, props, ...children) {
  const flat = children.flat().filter((c) => c !== null && c !== undefined && c !== false && c !== "");
  return { type, props: { ...props, children: flat.length === 1 ? flat[0] : flat } };
}

function cardTree(card) {
  const accent = ACCENT[card.kind] || ACCENT.place;
  const blurb = String(card.description || "").slice(0, 140);
  return el(
    "div",
    {
      style: {
        width: "1200px",
        height: "630px",
        display: "flex",
        background: "#f3ead9",
        fontFamily: "Heebo",
        color: "#1a2b24",
      },
    },
    el("div", {
      style: {
        width: "88px",
        height: "630px",
        background: accent,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      },
    }, el("div", {
      style: {
        width: "56px",
        height: "56px",
        borderRadius: "16px",
        background: "#fffaf1",
        color: accent,
        fontSize: "28px",
        fontWeight: 800,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      },
    }, "ר")),
    el(
      "div",
      {
        style: {
          flex: 1,
          height: "630px",
          display: "flex",
          flexDirection: "column",
          padding: "56px 64px 48px 56px",
          justifyContent: "space-between",
        },
      },
      el(
        "div",
        { style: { display: "flex", flexDirection: "column" } },
        el("div", {
          style: { fontSize: "22px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: accent },
        }, "Welcome to Ra'anana"),
        el("div", {
          style: { marginTop: "10px", fontSize: "22px", fontWeight: 600, color: "#3d5248" },
        }, card.kicker),
      ),
      el(
        "div",
        { style: { display: "flex", flexDirection: "column", maxWidth: "980px" } },
        el("div", {
          style: {
            fontSize: card.title.length > 42 ? "52px" : "64px",
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: "-0.03em",
          },
        }, card.title),
        card.he
          ? el("div", {
            style: {
              marginTop: "12px",
              fontSize: "36px",
              fontWeight: 700,
              color: "#1c4a3c",
            },
          }, card.he)
          : null,
        el("div", {
          style: { marginTop: "18px", fontSize: "26px", color: "#3d5248", lineHeight: 1.35, fontWeight: 500 },
        }, blurb),
      ),
      el("div", {
        style: { fontSize: "20px", fontWeight: 700, color: accent },
      }, "welcome-to-raanana.vercel.app"),
    ),
  );
}

async function renderPng(card) {
  const svg = await satori(cardTree(card), {
    width: 1200,
    height: 630,
    fonts: [
      { name: "Heebo", data: medium, weight: 500, style: "normal" },
      { name: "Heebo", data: medium, weight: 600, style: "normal" },
      { name: "Heebo", data: bold, weight: 700, style: "normal" },
      { name: "Heebo", data: bold, weight: 800, style: "normal" },
    ],
  });
  return new Resvg(svg, { fitTo: { mode: "width", value: 1200 } }).render().asPng();
}

function destFor(imagePath) {
  return join(outRoot, imagePath.replace(/^\/og\//, ""));
}

const cards = allCards();
mkdirSync(join(outRoot, "e"), { recursive: true });
mkdirSync(join(outRoot, "d"), { recursive: true });
mkdirSync(join(outRoot, "p"), { recursive: true });
mkdirSync(join(outRoot, "c"), { recursive: true });

let n = 0;
for (const card of cards) {
  // Home uses the illustrated welcome photo in public/og/default.png.
  if (card.image === "/og/default.png") {
    if (!existsSync(join(outRoot, "default.png"))) {
      throw new Error("missing public/og/default.png — home share card is not generated");
    }
    continue;
  }
  const png = await renderPng(card);
  const dest = destFor(card.image);
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, png);
  n += 1;
  if (n % 80 === 0) console.log(`og: ${n}/${cards.length}`);
}

console.log(`og: wrote ${n} share cards`);
