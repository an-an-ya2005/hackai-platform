import { EditApplicationContent } from "./edit-content";

interface EditApplicationPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditApplicationPage({ params }: EditApplicationPageProps) {
  const { id } = await params;
  
  return <EditApplicationContent applicationId={id} />;
}
