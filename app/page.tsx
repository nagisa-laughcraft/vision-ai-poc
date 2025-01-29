"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, Upload } from "lucide-react";
import { ref, uploadBytes, getDownloadURL, listAll } from "firebase/storage";
import { collection, getDocs } from "firebase/firestore";
import { storage, db } from "@/lib/firebaseConfig";

export default function Home() {
  const [uploading, setUploading] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [visionResults, setVisionResults] = useState<{ id: string; labels: string[] }[]>([]);

  useEffect(() => {
    fetchImages();
    fetchVisionResults();
  }, []);

  const fetchImages = async () => {
    const storageRef = ref(storage, "uploads/");
    try {
      const result = await listAll(storageRef);
      const urls = await Promise.all(result.items.map(async (item) => getDownloadURL(item)));
      setImageUrls(urls);
    } catch (error) {
      console.error("画像の取得に失敗しました:", error);
    }
  };

  const fetchVisionResults = async () => {
    const querySnapshot = await getDocs(collection(db, "vision_results"));
    const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as { id: string; labels: string[] }[];
    setVisionResults(data);
  };

  const handleUploadClick = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) return;
    const file = event.target.files[0];
    const storageRef = ref(storage, `uploads/${file.name}`);

    setUploading(true);

    try {
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      setImageUrls((prev) => [...prev, downloadURL]);
      console.log("アップロード成功！URL:", downloadURL);
    } catch (error) {
      console.error("アップロード失敗:", error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <main className="container mx-auto p-4">
      {/* Button Group */}
      <div className="flex gap-4 mb-8">
        <Button className="flex items-center gap-2" variant="secondary">
          <Camera className="h-4 w-4" />
          カメラを起動
        </Button>
        <label className="btn btn-secondary flex items-center gap-2 cursor-pointer">
          <Upload className="h-4 w-4" />
          画像をアップロード
          <input type="file" onChange={handleUploadClick} className="hidden" />
        </label>
      </div>
      {uploading && <p className="text-center">アップロード中...</p>}

      {/* Uploaded Images */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {imageUrls.map((url, index) => (
          <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow">
            <CardContent className="p-0">
              <div className="aspect-[4/3] relative">
                <img
                  src={url}
                  alt={`Uploaded ${index}`}
                  className="object-cover w-full h-full"
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Vision AI 解析結果 */}
      <div className="mt-8 p-4 border rounded-lg">
        <h2 className="text-lg font-bold">Vision AI 解析結果</h2>
        <ul>
          {visionResults.map((result) => (
            <li key={result.id} className="p-2 border-b">
              <p className="font-semibold">{result.id}</p>
              <p className="text-gray-700">ラベル: {result.labels.join(", ")}</p>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}