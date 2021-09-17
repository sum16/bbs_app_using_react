import React, { useEffect, useState } from "react";
import { API, graphqlOperation } from "aws-amplify";
import { listPosts } from "./graphql/queries";
import { createPost } from "./graphql/mutations";
import { onCreatePost } from "./graphql/subscriptions";
import {
  ListPostsQuery,
  OnCreatePostSubscription,
  CreatePostMutationVariables
} from "./API";

type Post = {
  id: string;
  title: string;
  content: string;
  price: number | null |undefined;
  rating: number | null |undefined;
};

type FormState = {
  title: string;
  content: string;
};

type PostSubscriptionEvent = { value: { data: OnCreatePostSubscription } };

const usePosts = () => {
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    (async () => {
      // 最初のPost一覧取得
      const result = await API.graphql(graphqlOperation(listPosts));
      if ("data" in result && result.data) {
        const posts = result.data as ListPostsQuery;
        if (posts.listPosts) {
          setPosts(posts.listPosts.items as Post[]);
        }
      }

      // Post追加イベントの購読
      const client = API.graphql(graphqlOperation(onCreatePost));
      if ("subscribe" in client) {
        client.subscribe({
          next: ({ value: { data } }: PostSubscriptionEvent) => {
            if (data.onCreatePost) {
              const a= data.onCreatePost
              const post: Post = {id:a.id,
                title: a.title,
                content: a.content,
                price: a.price,
                rating:a.rating}
              setPosts(prev => [...prev, post]);
            }
          }
        });
      }
    })();
  }, []);

  return posts;
};

const App: React.FC = () => {
  const [input, setInput] = useState<FormState>({
    title: "",
    content: ""
  });
  const posts = usePosts();

  const onFormChange = ({
    target: { name, value }
  }: React.ChangeEvent<HTMLInputElement>) => {
    setInput(prev => ({ ...prev, [name]: value }));
  };

  const onPost = () => {
    if (input.title === "" || input.content === "") return;
    const newPost: CreatePostMutationVariables = {
      input: {
        title: input.title,
        content: input.content
      }
    };
    setInput({ title: "", content: "" });
    API.graphql(graphqlOperation(createPost, newPost));
  };

  return (
    <div className="App">
      <div>
        タイトル
        <input value={input.title} name="title" onChange={onFormChange} />
      </div>
      <div>
        内容
        <input value={input.content} name="content" onChange={onFormChange} />
      </div>
      <button onClick={onPost}>追加</button>
      <div>
        {posts.map((data,i) => {
          return (
            <div key={i}>
              <h4>{data.title}</h4>
              <p>{data.content}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default App;