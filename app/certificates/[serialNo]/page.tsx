import { CertificateView } from "@/components/certificates/CertificateView";

export default function CertificatePage({ params }: { params: { serialNo: string } }) {
  return <CertificateView serialNo={params.serialNo} />;
}
