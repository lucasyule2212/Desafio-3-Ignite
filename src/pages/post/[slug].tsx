/* eslint-disable no-plusplus */
/* eslint-disable no-param-reassign */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import Head from 'next/head';
import next, { GetStaticPaths, GetStaticProps } from 'next';
import Link from 'next/link';
import Prismic from '@prismicio/client';
import { useRouter } from 'next/router';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';
import { RichText } from 'prismic-dom';
import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import Header from '../../components/Header';
import Comments from '../../components/Comments';

interface Post {
  id: string;
  uid: string;
  first_publication_date: string | null;
  last_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
  navigation: {
    prevPost: Post[] | null;
    nextPost: Post[] | null;
  };
  preview;
}

export default function Post({
  post,
  navigation,
  preview,
}: PostProps): JSX.Element {
  const router = useRouter();
  console.log(preview);

  if (router.isFallback) {
    return <h1>Carregando...</h1>;
  }
  const readingTime = post.data.content.reduce((total, contentItem) => {
    total += contentItem.heading.split(' ').length;
    const words = contentItem.body.map(item => item.text.split(' ').length);
    // eslint-disable-next-line no-return-assign
    words.map(word => (total += word));
    return total;
  }, 0);
  const formattedReadingTime = Math.ceil(readingTime / 200);

  return (
    <>
      <Head>
        <title>YuleSpace | {post.data.title}</title>
      </Head>
      <Header />
      <div className={styles.bannerDiv}>
        <img src={`${post.data.banner.url}`} alt={`${post.data.title}`} />
      </div>
      <main className={styles.content}>
        <div className={styles.contentHeading}>
          <h1>{post.data.title}</h1>
          <ul>
            <li>
              <FiCalendar />
              {format(new Date(post.first_publication_date), 'dd MMM yyyy', {
                locale: ptBR,
              })}
            </li>
            <li>
              <FiUser />
              {post.data.author}
            </li>
            <li>
              <FiClock />
              {`${formattedReadingTime} min`}
            </li>
            <li>
              {format(
                new Date(post.last_publication_date),
                "'* editado em 'dd MMM yyyy,' às 'kk:mm",
                {
                  locale: ptBR,
                }
              )}
            </li>
          </ul>
        </div>
        <div className={styles.contentBody}>
          {post.data.content.map(content => {
            return (
              <article key={post.id}>
                <h2>{content.heading}</h2>
                <div
                  dangerouslySetInnerHTML={{
                    __html: RichText.asHtml(content.body),
                  }}
                />
              </article>
            );
          })}
        </div>
      </main>

      <div className={styles.navigation}>

        {navigation.prevPost.length > 0 && (
          <div className={styles.previousDiv}>
            <h3>{navigation.prevPost[0].data.title}</h3>
            <Link href={`${navigation.prevPost[0].uid}`}>
              <a>Post Anterior</a>
            </Link>
          </div>
        )}
        {navigation.nextPost?.length > 0 && (
          <div className={styles.nextDiv}>
            <h3>{navigation.nextPost[0].data.title}</h3>
            <Link href={`${navigation.nextPost[0].uid}`}>
              <a>Próximo Post</a>
            </Link>
          </div>
        )}     
      </div>
      <Comments/>
      {preview && (
          <aside className={styles.preview}>
            <Link href="/api/exit-preview">
              <a>Sair do modo Preview</a>
            </Link>
          </aside>
        )}
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query([
    Prismic.predicates.at('document.type', 'pos'),
  ]);
  const paths = posts.results.map(post => {
    return {
      params: {
        slug: post.uid,
      },
    };
  });
  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({
  params,
  preview = false,
  previewData,
}) => {
  const prismic = getPrismicClient();
  const { slug } = params;

  const response = await prismic.getByUID('pos', String(slug), {
    ref: previewData?.ref ?? null,
  });

  const prevPost = await prismic.query(
    [Prismic.Predicates.at('document.type', 'pos')],
    {
      pageSize: 1,
      after: response.id,
      orderings: '[document.first_publication_date]',
    }
  );

  const nextPost = await prismic.query(
    [Prismic.Predicates.at('document.type', 'pos')],
    {
      pageSize: 1,
      after: response.id,
      orderings: '[document.last_publication_date desc]',
    }
  );

  const post = {
    id: response.id,
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    last_publication_date: response.last_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      author: response.data.author,
      banner: {
        url: response.data.banner.url,
      },
      content: response.data.content.map(content => {
        return {
          heading: content.heading,
          body: [...content.body],
        };
      }),
    },
  };

  return {
    props: {
      post,
      navigation: {
        prevPost: prevPost?.results,
        nextPost: nextPost?.results,
      },
      preview,
    },
  };
};
