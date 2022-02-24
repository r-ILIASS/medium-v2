// dependencies
import { useState } from 'react'
import PortableText from 'react-portable-text'
import { useForm, SubmitHandler } from 'react-hook-form'
// components
import Header from '../../components/Header'
// sanity
import { sanityClient, urlFor } from '../../sanity'
// typings
import { Post } from '../../typings'
import { GetStaticProps } from 'next'

interface FormInput {
  _id: string
  name: string
  email: string
  comment: string
}

interface Props {
  post: Post
}

function Post({ post }: Props) {
  const [submitted, setSubmitted] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormInput>()

  const onSubmit: SubmitHandler<FormInput> = (data) => {
    fetch('/api/createComment', {
      method: 'POST',
      body: JSON.stringify(data),
    })
      .then(() => setSubmitted(true))
      .catch((err) => console.log(err))
  }

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

      <div className="mx-auto max-w-3xl px-5">
        <hr className="border border-gray-300" />
      </div>

      {/* comment form */}
      {submitted ? (
        <div className="my-10 mx-auto flex max-w-2xl flex-col bg-yellow-500 p-10 text-white">
          <h3 className="text-2xl font-bold">Thank you for your comment!</h3>
          <p>Once it has been approved, it will appear bellow.</p>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mx-auto my-10 mb-10 flex max-w-2xl flex-col p-5"
        >
          <h4 className="text-2xl font-bold">
            Leave a comment bellow if you enjoyed the article!
          </h4>
          <hr className="mt-2 py-3" />

          <input {...register('_id')} type="hidden" value={post._id} />

          <label className="mb-5 block">
            <span className="block text-gray-700">Name</span>
            <input
              {...register('name', { required: true })}
              className="form-input mt-1 block w-full rounded border py-2 px-3 shadow outline-none ring-yellow-500 focus:ring"
              type="text"
              placeholder="John Smith"
            />
            {errors.name && (
              <span className="text-red-500">This field is required</span>
            )}
          </label>
          <label className="mb-5 block">
            <span className="block text-gray-700">Email</span>
            <input
              {...register('email', { required: true })}
              className="form-input mt-1 block w-full rounded border py-2 px-3 shadow outline-none ring-yellow-500 focus:ring"
              type="text"
              placeholder="John Smith"
            />
            {errors.email && (
              <span className="text-red-500">This field is required</span>
            )}
          </label>
          <label className="mb-5 block">
            <span className="block text-gray-700">Comment</span>
            <textarea
              {...register('comment', { required: true })}
              className="shaddow form-textarea mt-1 block w-full rounded border py-2 px-3 outline-none ring-yellow-500 focus:ring"
              placeholder="John Smith"
              rows={8}
            />
            {errors.comment && (
              <span className="text-red-500">This field is required</span>
            )}
          </label>

          <input
            type="submit"
            className="focus:shadow-outline cursor-pointer rounded bg-yellow-500 py-2 px-4 font-bold text-white shadow hover:bg-yellow-400 focus:outline-none"
          />
        </form>
      )}
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
