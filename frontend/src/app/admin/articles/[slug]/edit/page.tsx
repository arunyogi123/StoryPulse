import EditArticleClient from "./EditArticleClient";

export async function generateStaticParams() {
  return [{ slug: "_placeholder" }];
}

export default function EditArticlePage() {
  return <EditArticleClient />;
}
