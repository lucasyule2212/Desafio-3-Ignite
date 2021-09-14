/* eslint-disable prettier/prettier */
import { Document } from '@prismicio/client/types/documents';
import { getPrismicClient } from '../../services/prismic';

const linkResolver = (doc: Document): string => {
  if (doc.type === 'pos') {
    return `/post/${doc.uid}`;
  }
  return '/';
};

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export default async (req, res) => {
  const { token: ref, documentId } = req.query;

  const redirectUrl = await getPrismicClient(req)
    .getPreviewResolver(ref, documentId)
    .resolve(linkResolver, '/');

  if (!redirectUrl) {
    return res.status(201).json({ message: 'Invalid token' });
  }

  res.setPreviewData({ ref });
  
  res.write(
    `<!DOCTYPE html><html><head><meta http-equiv="Refresh" content="0; url=${redirectUrl}" />
    <script>window.location.href = '${redirectUrl}'</script>
    </head>`
  );

  res.end();
  return res.status(200);
};
