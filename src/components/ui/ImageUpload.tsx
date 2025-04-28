import React, { useState, ChangeEvent } from "react";
import { PaintBucket, X } from "lucide-react";
import { PinataSDK } from "pinata-web3";
import { Card } from "@chakra-ui/react";

// Define interface for component props
interface ImageUploadProps {
  imagePreview: string | null;
  setImagePreview: (url: string | null) => void;
  onImageUrl: (url: string) => void;
}

const pinata = new PinataSDK({
  pinataJwt: process.env.NEXT_PUBLIC_PINATA_JWT,
  pinataGateway: process.env.NEXT_PUBLIC_PINATA_GATEWAY,
});

const ImageUpload: React.FC<ImageUploadProps> = ({
  imagePreview,
  setImagePreview,
  onImageUrl,
}) => {
  async function onChange(e: ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || e.target.files.length === 0) {
      console.error("No file selected.");
      return;
    }

    const file = e.target.files[0];
    console.log("file:", file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    let url = process.env.NEXT_PUBLIC_PINATA_GATEWAY;

    try {
      const upload = await pinata.upload.file(file);
      if (!upload || !upload.IpfsHash) {
        throw new Error("Invalid upload response from Pinata");
      }

      const gateway = process.env.NEXT_PUBLIC_PINATA_GATEWAY;
      if (!gateway) {
        console.error("Pinata gateway is not defined in environment variables");
        return;
      }

      const fileUrl = gateway.startsWith("http")
        ? `${gateway}/ipfs/${upload.IpfsHash}`
        : `https://${gateway}/ipfs/${upload.IpfsHash}`;

      setImagePreview(fileUrl);
      onImageUrl(fileUrl);
      console.log("Uploaded File URL:", fileUrl);
    } catch (error) {
      console.error("Upload Error:", error);
    }
  }

  const handleRemoveImage = (): void => {
    setImagePreview(null);
    const imageInput = document.getElementById("image") as HTMLInputElement;
    if (imageInput) {
      imageInput.value = "";
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Upload area - Only show if no image is selected */}
      {!imagePreview ? (
        <div className="relative w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors">
          <PaintBucket className="mb-2" />
          <label htmlFor="image" className="relative z-30 cursor-pointer">
            <span className="font-medium">Drag & Drop</span> Or Browse
          </label>
          <input
            type="file"
            name="image"
            id="image"
            accept="image/*"
            onChange={onChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>
      ) : (
        <div className="relative w-full">
          <input
            type="file"
            name="image"
            id="image"
            accept="image/*"
            onChange={onChange}
            className="hidden"
          />
        </div>
      )}

      {/* Preview Card */}
      {imagePreview && (
        <div className="relative w-[180px]">
          <div
            className="absolute -top-4 -right-4 h-8 w-8 bg-black rounded-full grid place-content-center cursor-pointer z-10"
            onClick={handleRemoveImage}
          >
            <X className="text-white text-sm opacity-100" />
          </div>
          <Card.Root
            width="180px"
            variant={"elevated"}
            className="border border-black shadow-3d p-0 overflow-hidden  mx-auto"
          >
            <div className="w-full h-full aspect-square relative">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            </div>
          </Card.Root>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
