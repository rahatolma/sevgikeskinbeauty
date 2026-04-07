import CommunicationManager from "@/components/admin/CommunicationManager";

export const metadata = {
  title: "İletişim & Aboneler | Admin OS",
  description: "Gelen kutusu ve bülten aboneleri yönetimi.",
};

export default function IletisimAdminPage() {
  return <CommunicationManager />;
}
