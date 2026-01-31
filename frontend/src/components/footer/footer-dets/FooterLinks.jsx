import React from 'react'
import { Link } from 'react-router-dom'

const FooterLinks = () => {
  const quickLinks = [
    {
      title: "shipping policy",
      path: "/policies/shipping-policy",
    },
    {
      title: "refund policy",
      path: "/policies/refund-policy",
    },
    {
      title: "terms of services",
      path: "/policies/terms-of-service",
    },
    {
      title: "privacy policy",
      path: "/policies/privacy-policy",
    },
    {
      title: "cookie policy",
      path: "/policies/cookie-policy",
    },
    {
      title: "disclaimer",
      path: "/policies/disclaimer",
    },
  ]
  return (
    <section className='footer-links-section'>
      <h3 className='footer-section-heading font-semibold tracking-wider mt-3 capitalize'>information</h3>
      <ul className='mt-4 flex flex-col gap-4'>
        {
        quickLinks.map(({title, path}) => (
          <li key={`${title}-footer-link-key`} className='w-fit'>
            <Link className='w-fit capitalize' to={path}>{title}</Link>
          </li>
        ))
      }
      </ul>
    </section>
  )
}

export default FooterLinks