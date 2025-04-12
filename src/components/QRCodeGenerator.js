import { QRCodeCanvas } from 'qrcode.react';

const QRCodeGenerator = ({ queueId, width = 150, height = 150 }) => {
  const qrText = `${window.location.origin}/join-queue?queueId=${queueId}`;
  return <QRCodeCanvas value={qrText} size={width} />;
};

export default QRCodeGenerator;
