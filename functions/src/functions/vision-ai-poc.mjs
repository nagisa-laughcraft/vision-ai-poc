import { onObjectFinalized } from "firebase-functions/v2/storage";
import vision from "@google-cloud/vision";
import admin from "firebase-admin";

// Firebase の初期化（冗長な関数化を削除）
if (!admin.apps.length) {
  admin.initializeApp();
}
const firestore = admin.firestore();
const client = new vision.ImageAnnotatorClient();

const TARGET_DOMAINS = ["amazon.co.jp", "rakuten.co.jp", "shopping.yahoo.co.jp", "kakaku.com"];
const TYPE_CANDIDATES = [
  "日本酒", "sake",
  "ウイスキー", "whiskey",
  "ワイン", "wine",
  "ビール", "beer",
  "ジン", "gin",
  "ウォッカ", "vodka",
  "ラム", "rum",
  "テキーラ", "tequila",
  "ブランデー", "brandy",
  "リキュール", "liqueur"
];

// スペック情報の抽出ロジック（正規表現を最適化）
function extractSpecs(textAnnotations) {
  const specs = {};
  textAnnotations.forEach(({ description }) => {
    const matches = {
      精米歩合: /精米歩合[:\s]*([\d]+%?)/.exec(description),
      使用米: /使用米[:\s]*(\S+)/.exec(description),
      アルコール度数: /アルコール度数[:\s]*([\d]+%?)/.exec(description),
      ブドウ品種: /(カベルネ・ソーヴィニヨン|メルロー|ピノ・ノワール|シャルドネ|ソーヴィニヨン・ブラン)/.exec(description),
      熟成年数: /(\d{2})年/.exec(description),
    };

    Object.entries(matches).forEach(([key, match]) => {
      if (match) specs[key] = match[1];
    });
  });
  return specs;
}

// Firestore に保存するためのデータ整形関数（データの正確性向上）
function processVisionData(result) {
  const webDetection = result.webDetection || {};
  const logoAnnotations = result.logoAnnotations || [];

  // 酒の種類の判定（確信度の高いものを採用）
  let detectedType = "不明";
  let maxScore = 0;
  
  webDetection.webEntities?.forEach(({ description, score }) => {
    const lowerDesc = description.toLowerCase();
    if (TYPE_CANDIDATES.includes(lowerDesc) && score > maxScore) {
      detectedType = description;
      maxScore = score;
    }
  });

  // 銘柄名（Web Detection の推測ラベルを利用）
  const detectedBrand = webDetection.bestGuessLabels?.[0]?.label || "不明";

  // 製造元（ロゴ解析）
  const detectedMaker = logoAnnotations.length > 0 ? logoAnnotations[0].description : "不明";

  // 購入リンク（`Set` を利用して重複排除）
  const purchaseLinks = {};
  const foundLinks = new Set();

  webDetection.pagesWithMatchingImages?.forEach(({ url }) => {
    TARGET_DOMAINS.forEach((domain) => {
      if (url.includes(domain) && !foundLinks.has(url)) {
        purchaseLinks[domain] = url;
        foundLinks.add(url);
      }
    });
  });

  return {
    type: detectedType,
    brand: detectedBrand,
    maker: detectedMaker,
    purchaseLinks,
    rawVisionData: result
  };
}

export const analyzeImage = onObjectFinalized({ region: "asia-northeast1" }, async (event) => {
  const file = event.data.name;
  const bucket = event.data.bucket;

  if (!file || !bucket) {
    console.error("ファイルまたはバケットが見つかりません");
    return;
  }

  const imageUri = `gs://${bucket}/${file}`;
  const docId = file.replace(/\.[^/.]+$/, "").replace(/\//g, "_");
  const docRef = firestore.collection("vision_results").doc(docId);

  console.log(`解析対象の画像 URI: ${imageUri}`);
  console.log(`Firestore に保存するドキュメント ID: ${docId}`);

  try {
    const storage = admin.storage();
    const fileRef = storage.bucket(bucket).file(file);
    let httpsUrl = "N/A";

    try {
      [httpsUrl] = await fileRef.getSignedUrl({
        action: "read",
        expires: "03-01-2500",
      });
    } catch (error) {
      console.error("署名付き URL の取得に失敗:", error);
    }

    const [result] = await client.annotateImage({
      image: { source: { imageUri } },
      features: [
        { type: "WEB_DETECTION" },
        { type: "LOGO_DETECTION" },
        { type: "TEXT_DETECTION" },
      ],
    });

    const processedData = processVisionData(result);
    const textAnnotations = result.textAnnotations || [];
    const specs = extractSpecs(textAnnotations);

    await docRef.set({
      imageUri: httpsUrl,
      ...processedData,
      specs,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log("Firestore に解析結果を保存しました");
  } catch (error) {
    console.error("Firestore への保存に失敗:", error);
  }
});