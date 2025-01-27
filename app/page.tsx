"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, Upload } from "lucide-react";

// Sample sake data
const sakeList = [
  {
    id: 1,
    name: "画像1",
    image: "https://placehold.jp/300x300.png",
  },
  {
    id: 2,
    name: "画像2",
    image: "https://placehold.jp/300x300.png",
  },
  {
    id: 3,
    name: "画像3",
    image: "https://placehold.jp/300x300.png",
  },
];

export default function Home() {
  const handleCameraClick = () => {
    // Camera functionality would go here
    console.log("Camera button clicked");
  };

  const handleUploadClick = () => {
    // Upload functionality would go here
    console.log("Upload button clicked");
  };

  return (
    <main className="container mx-auto p-4">
      {/* Button Group */}
      <div className="flex gap-4 mb-8">
        <Button
          onClick={handleCameraClick}
          className="flex items-center gap-2"
          variant="secondary"
        >
          <Camera className="h-4 w-4" />
          カメラを起動
        </Button>
        <Button
          onClick={handleUploadClick}
          className="flex items-center gap-2"
          variant="secondary"
        >
          <Upload className="h-4 w-4" />
          画像をアップロード
        </Button>
      </div>

      {/* Sake Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sakeList.map((sake) => (
          <Card key={sake.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <CardContent className="p-0">
              <div className="aspect-[4/3] relative">
                <img
                  src={sake.image}
                  alt={sake.name}
                  className="object-cover w-full h-full"
                />
              </div>
              <div className="p-4">
                <h2 className="text-xl font-semibold text-gray-900">{sake.name}</h2>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}