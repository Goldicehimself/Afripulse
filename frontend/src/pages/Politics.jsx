import ExternalFeed from "../components/ExternalFeed";
import PostFeed from "../components/PostFeed";

function Politics() {
  return (
    <div className="space-y-10">
      <ExternalFeed
        feedKey="nigeria-politics"
        title="Nigeria Politics"
        subtitle="Political headlines and public affairs from Nigeria."
      />
      <PostFeed
        fixedCategory="news"
        title="More Politics"
        subtitle="Analysis, context, and political updates."
        hideWhenEmpty
      />
    </div>
  );
}

export default Politics;
