// dependencies
import PortableText from 'react-portable-text'
// components
import Header from '../../components/Header'
// sanity
import { sanityClient, urlFor } from '../../sanity'
// typings
import { Post } from '../../typings'
import { GetStaticProps } from 'next'

interface Props {
  post: Post
}

function Post({ post }: Props) {
  console.log(post)
  return (
    <main>
      <Header />

      <img
        className="h-60 w-full object-cover"
        src={urlFor(post.mainImage).url()!}
        alt=""
      />
      <article className="mx-auto max-w-3xl p-5">
        <h1 className="mt-10 mb-3 text-3xl">{post.title}</h1>
        <h2 className="text-xl font-light">{post.description}</h2>
        <div className="mb-8 flex items-center space-x-2">
          <img
            className="h-10 w-10 rounded-full"
            src={urlFor(post.author.image).url()!}
            alt="author"
          />
          <p className="text-sm font-extralight">
            Blog post by{' '}
            <span className="text-green-600">{post.author.name}</span> -
            Pulblished at {new Date(post._createdAt).toLocaleDateString()}
          </p>
        </div>
        <div>
          <PortableText
            className=""
            projectId={process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!}
            dataset={process.env.NEXT_PUBLIC_SANITY_DATASET!}
            serializers={{
              normal: ({ children }: any) => (
                <p className="text-justify text-base">{children}</p>
              ),
              h1: (props: any) => (
                <h1 className="my-5 text-2xl font-bold" {...props} />
              ),
              h2: (props: any) => (
                <h1 className="my-3 text-2xl font-bold" {...props} />
              ),
              li:
                (porps: any) =>
                ({ children }: any) =>
                  <li className="ml-4 list-disc">{children}</li>,
              link: ({ href, children }: any) => (
                <a href={href} className="text-blue-500 hover:underline">
                  {children}
                </a>
              ),
            }}
            content={post.body}
          />
        </div>
      </article>
    </main>
  )
}

export const getStaticPaths = async () => {
  const query = `*[_type == "post"]{
        _id,
        slug{
        current
        }
      }`

  const posts = await sanityClient.fetch(query)

  const paths = posts.map((post: Post) => ({
    params: {
      slug: post.slug.current,
    },
  }))

  return {
    paths,
    fallback: 'blocking',
  }
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const query = `*[_type == "post" && slug.current == $slug][0]{
    _id,
    _createdAt,
    title,
    author -> {
      name,
      image
    },
    description,
    mainImage,
    slug,
    body
  }`

  const post = await sanityClient.fetch(query, {
    slug: params?.slug,
  })

  if (!post) {
    return {
      notFound: true,
    }
  }

  return {
    props: {
      post,
    },
    revalidate: 60, // This makes sure that the cache will be updated every 60 seconds
  }
}

export default Post
