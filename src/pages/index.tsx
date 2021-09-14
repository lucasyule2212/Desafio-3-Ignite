/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { useState } from 'react';
import { GetStaticProps } from 'next';
import Head from 'next/head';
import Prismic from '@prismicio/client';

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import Link from 'next/dist/client/link';
import { FiCalendar, FiUser } from 'react-icons/fi';

import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import Header from '../components/Header';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
  preview
}

export default function Home({ postsPagination,preview }: HomeProps): JSX.Element {
  const formattedPosts = postsPagination.results.map(post => {
    return {
      ...post,
      first_publication_date: format(
        new Date(post.first_publication_date),
        'dd MMM yyyy',
        { locale: ptBR }
      ),
    };
  });
  console.log(preview);
  

  const [posts, setPosts] = useState<Post[]>(formattedPosts);
  const [nextPage, setNextPage] = useState(postsPagination.next_page);
  // const [currentPage,setCurrentPage] = useState(1);

  async function handleLoadMorePosts() {
    if (nextPage === null) {
      return;
    }

    const fetchPosts = await fetch(nextPage).then(response => response.json());

    const newPosts = fetchPosts.results.map(post => {
      return {
        uid: post.uid,
        first_publication_date: format(
          new Date(post.first_publication_date),
          'dd MMM yyyy',
          { locale: ptBR }
        ),
        data: {
          title: post.data.title,
          subtitle: post.data.subtitle,
          author: post.data.author,
        },
      };
    });

    setPosts(posts.concat(newPosts));
    setNextPage(fetchPosts.next_page);
  }

  return (
    <>
      <Head>
        <title>YuleSpace | Home</title>
      </Head>
      <Header />
      <main className={styles.container}>
        <div className={styles.posts}>
          {posts.map(post => {
            return (
              <Link key={post.uid} href={`/post/${post.uid}`}>
                <a>
                  <strong>{post.data.title}</strong>
                  <p>{post.data.subtitle}</p>
                  <ul>
                    <li>
                      <FiCalendar />
                      {post.first_publication_date}
                    </li>
                    <li>
                      <FiUser />
                      {post.data.author}
                    </li>
                  </ul>
                </a>
              </Link>
            );
          })}

          {nextPage ? (
            <button type="button" onClick={handleLoadMorePosts}>
              Carregar mais posts
            </button>
          ) : (
            ''
          )}
        </div>
        {preview && (
          <aside className={styles.preview}>
            <Link href="/api/exit-preview">
              <a>Sair do modo Preview</a>
            </Link>
          </aside>
        )}
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async ({
  preview = false,
  previewData,
}) => {
  const prismic = getPrismicClient();

  const postsResponse: PostPagination = await prismic.query(
    [Prismic.predicates.at('document.type', 'pos')],
    {
      pageSize: 2,
      ref: previewData?.ref ?? null,
    }
  );

  const posts = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    };
  });

  const postsPagination = {
    next_page: postsResponse.next_page,
    results: posts,
  };

  return {
    props: {
      postsPagination,
      preview,
    },
  };
};
