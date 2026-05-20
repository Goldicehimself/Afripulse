import PostFeed from "../components/PostFeed";
import ExternalFeed from "../components/ExternalFeed";

function News() {
  return (
    <div className="space-y-10">
      <ExternalFeed
        feedKey="nigeria-news"
        title="Nigeria News"
        subtitle="Fresh headlines from Nigeria."
      />
      <ExternalFeed
        feedKey="africa-gist"
        title="Africa Gist"
        subtitle="Culture, celebrity, and lifestyle stories across Africa."
      />
      <PostFeed
        fixedCategory="news"
        title="More News"
        subtitle="Latest updates and featured stories."
        hideWhenEmpty
      />
    </div>
  );
}

export default News;
