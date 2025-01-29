"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Upload } from "lucide-react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, getDocs } from "firebase/firestore";
import { storage, db } from "@/lib/firebaseConfig";

interface VisionResult {
  imageUri: string;
  specs: Record<string, string>;
  timestamp: any;
  type: string;
  brand: string;
  maker: string;
  purchaseLinks: Record<string, string>;
}

export default function Home() {
  const [uploading, setUploading] = useState(false);
  const [visionResults, setVisionResults] = useState<VisionResult[]>([]);

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "vision_results"));
      const results = querySnapshot.docs.map(doc => doc.data() as VisionResult);
      setVisionResults(results);
    } catch (error) {
      console.error("画像の取得に失敗しました:", error);
    }
  };

  const handleUploadClick = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) return;
    const file = event.target.files[0];
    const storageRef = ref(storage, `uploads/${file.name}`);

    setUploading(true);

    try {
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
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
        <label className="btn btn-secondary flex items-center gap-2 cursor-pointer">
          <Upload className="h-4 w-4" />
          画像をアップロード
          <input type="file" onChange={handleUploadClick} className="hidden" />
        </label>
      </div>
      {uploading && <p className="text-center">アップロード中...</p>}

      {/* Uploaded Images */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {visionResults.map((result, index) => (
          <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow">
            <CardContent className="p-0">
              <div className="aspect-[4/3] relative">
                <img
                  src={result.imageUri}
                  alt={`Uploaded ${index}`}
                  className="object-cover w-full h-full"
                />
              </div>
              <div className="p-4">
                <p>種類: {result.type}</p>
                <p>銘柄: {result.brand}</p>
                <p>製造元: {result.maker}</p>
                <div>
                  <p>スペック:</p>
                  {Object.entries(result.specs).map(([key, value]) => (
                    <p key={key}>{key}: {value}</p>
                  ))}
                </div>
                <div>
                  <p>購入リンク:</p>
                  {Object.entries(result.purchaseLinks).map(([domain, url]) => (
                    <a key={domain} href={url} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
                      {domain}
                    </a>
                  ))}
                </div>
                <p>アップロード日: {result.timestamp.toDate().toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
