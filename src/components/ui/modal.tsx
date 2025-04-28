import React from "react";

const Modal = ({ isOpen, transactionStatus, transactionHash }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content relative overflow-hidden">
        <video
          className="absolute top-0 left-0 w-full h-full object-cover"
          autoPlay
          loop
          muted
          src="https://video.wixstatic.com/video/f1c650_988626917c6549d6bdc9ae641ad3c444/1080p/mp4/file.mp4"
        ></video>
        <div className="relative z-10 text-white flex flex-col items-center">
          <p className="text-3xl font-bold mb-4">{transactionStatus}</p>

          {transactionHash ? (
            <p className="text-white">
              View transaction on{" "}
              <a
                href={`https://amoy.polygonscan.com/tx/${transactionHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 text-2xl underline underline-offset-8 decoration-white"
              >
                Amoy Explorer
              </a>
            </p>
          ) : (
            <div className="mt-32 flex justify-center">
              <div className="loader loader-center"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Modal;
