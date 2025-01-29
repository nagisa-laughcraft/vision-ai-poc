import { onObjectFinalized } from "firebase-functions/v2/storage";
import vision from "@google-cloud/vision";
import admin from "firebase-admin";

function getFirestore() {
  if (!admin.apps.length) {
    admin.initializeApp();
  }
  return admin.firestore();
}

export const analyzeImage = onObjectFinalized({ region: "asia-northeast1" },async (event) => {
  const client = new vision.ImageAnnotatorClient();
  const firestore = getFirestore();

  const file = event.data.name;
  const bucket = event.data.bucket;

  if (!file || !bucket) {
    console.error("ファイルまたはバケットが見つかりません");
    return;
  }

  const imageUri = `gs://${bucket}/${file}`;
  const docId = file.replace(/\.[^/.]+$/, "").replace(/\//g, "_");

  console.log(`解析対象の画像 URI: ${imageUri}`);
  console.log(`Firestore に保存するドキュメント ID: ${docId}`);

  try {
    const [result] = await client.labelDetection(imageUri);
    if (!result.labelAnnotations) {
      console.error("Vision AI に解析結果がありません。");
      return;
    }

    const labels = result.labelAnnotations.map(label => label.description);
    console.log(`解析結果: ${labels}`);

    console.log(`Firestore への書き込み開始: vision_results/${docId}`);

    await firestore.collection("vision_results").doc(docId).set({
      labels,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log("Firestore に解析結果を保存しました");
  } catch (error) {
    console.error("Firestore への保存に失敗:", error);
  }
});