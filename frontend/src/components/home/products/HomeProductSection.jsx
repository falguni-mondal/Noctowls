import ProductListItem from './ProductListItem';
import { Link } from 'react-router-dom';

const HomeProductSection = () => {

  const data = [
    {
      id: 1,
      name: "chains of desire",
      sizes: [
        {
          value: "l",
          price: "649.00",
          originalPrice: "1,199.00"
        },
        {
          value: "xl",
          price: "849.00",
          originalPrice: "1,599.00"
        },
        {
          value: "2xl",
          price: "1,049.00",
          originalPrice: "1,899.00"
        },
      ],
      reviews: [
        {
          user: {
            name: "Test User",
            review: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."
          },
          user: {
            name: "Test User 2",
            review: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."
          },
          user: {
            name: "Test User 3",
            review: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."
          },
          user: {
            name: "Test User 4",
            review: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."
          },
          user: {
            name: "Test User 5",
            review: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."
          },
        }
      ],
      rating: 4.5,
      images: [
        "https://noctowls.com/cdn/shop/files/01_02ea59d5-e679-4400-85f1-89b62b8772ac.png?v=1764082348&width=823",
        "https://noctowls.com/cdn/shop/files/02.png?v=1764082347&width=823",
        "https://noctowls.com/cdn/shop/files/03.png?v=1764082348&width=823",
        "https://noctowls.com/cdn/shop/files/04.png?v=1764082349&width=823",
        "https://noctowls.com/cdn/shop/files/05.png?v=1764082349&width=823",
        "https://noctowls.com/cdn/shop/files/06.png?v=1764082348&width=823",
        "https://noctowls.com/cdn/shop/files/07_1ed4576f-3063-4e2e-9f54-82fe31ad81d7.png?v=1764082348&width=823",
        "https://noctowls.com/cdn/shop/files/08_48f4b605-c26d-48ec-a55f-3db289702cd7.png?v=1764082347&width=823",
        "https://noctowls.com/cdn/shop/files/09_78f71ba7-d237-4538-8400-810744715094.png?v=1764082345&width=823",
        "https://noctowls.com/cdn/shop/files/10_c2ef1635-ac01-4f21-8745-e262e7a6d228.png?v=1764082346&width=823",
        "https://noctowls.com/cdn/shop/files/11_6d854a91-a125-409b-aee7-6562aef616e4.png?v=1764082345&width=823",
        "https://noctowls.com/cdn/shop/files/12_fb772405-75c7-4353-8701-a5f785391185.png?v=1764082347&width=823",
        "https://noctowls.com/cdn/shop/files/13_22ada8d0-273a-499c-aac2-b65bb05f72be.png?v=1764082344&width=823",
      ]
    },
    {
      id: 2,
      name: "chains of desire",
      sizes: [
        {
          value: "l",
          price: "649.00",
          originalPrice: "1,199.00"
        },
        {
          value: "xl",
          price: "849.00",
          originalPrice: "1,599.00"
        },
        {
          value: "2xl",
          price: "1,049.00",
          originalPrice: "1,899.00"
        },
      ],
      reviews: [
        {
          user: {
            name: "Test User",
            review: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."
          },
          user: {
            name: "Test User 2",
            review: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."
          },
          user: {
            name: "Test User 3",
            review: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."
          },
          user: {
            name: "Test User 4",
            review: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."
          },
          user: {
            name: "Test User 5",
            review: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."
          },
        }
      ],
      rating: 4.5,
      images: [
        "https://noctowls.com/cdn/shop/files/01_02ea59d5-e679-4400-85f1-89b62b8772ac.png?v=1764082348&width=823",
        "https://noctowls.com/cdn/shop/files/02.png?v=1764082347&width=823",
        "https://noctowls.com/cdn/shop/files/03.png?v=1764082348&width=823",
        "https://noctowls.com/cdn/shop/files/04.png?v=1764082349&width=823",
        "https://noctowls.com/cdn/shop/files/05.png?v=1764082349&width=823",
        "https://noctowls.com/cdn/shop/files/06.png?v=1764082348&width=823",
        "https://noctowls.com/cdn/shop/files/07_1ed4576f-3063-4e2e-9f54-82fe31ad81d7.png?v=1764082348&width=823",
        "https://noctowls.com/cdn/shop/files/08_48f4b605-c26d-48ec-a55f-3db289702cd7.png?v=1764082347&width=823",
        "https://noctowls.com/cdn/shop/files/09_78f71ba7-d237-4538-8400-810744715094.png?v=1764082345&width=823",
        "https://noctowls.com/cdn/shop/files/10_c2ef1635-ac01-4f21-8745-e262e7a6d228.png?v=1764082346&width=823",
        "https://noctowls.com/cdn/shop/files/11_6d854a91-a125-409b-aee7-6562aef616e4.png?v=1764082345&width=823",
        "https://noctowls.com/cdn/shop/files/12_fb772405-75c7-4353-8701-a5f785391185.png?v=1764082347&width=823",
        "https://noctowls.com/cdn/shop/files/13_22ada8d0-273a-499c-aac2-b65bb05f72be.png?v=1764082344&width=823",
      ]
    },
    {
      id: 3,
      name: "chains of desire",
      sizes: [
        {
          value: "l",
          price: "649.00",
          originalPrice: "1,199.00"
        },
        {
          value: "xl",
          price: "849.00",
          originalPrice: "1,599.00"
        },
        {
          value: "2xl",
          price: "1,049.00",
          originalPrice: "1,899.00"
        },
      ],
      reviews: [
        {
          user: {
            name: "Test User",
            review: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."
          },
          user: {
            name: "Test User 2",
            review: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."
          },
          user: {
            name: "Test User 3",
            review: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."
          },
          user: {
            name: "Test User 4",
            review: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."
          },
          user: {
            name: "Test User 5",
            review: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."
          },
        }
      ],
      rating: 4.5,
      images: [
        "https://noctowls.com/cdn/shop/files/01_02ea59d5-e679-4400-85f1-89b62b8772ac.png?v=1764082348&width=823",
        "https://noctowls.com/cdn/shop/files/02.png?v=1764082347&width=823",
        "https://noctowls.com/cdn/shop/files/03.png?v=1764082348&width=823",
        "https://noctowls.com/cdn/shop/files/04.png?v=1764082349&width=823",
        "https://noctowls.com/cdn/shop/files/05.png?v=1764082349&width=823",
        "https://noctowls.com/cdn/shop/files/06.png?v=1764082348&width=823",
        "https://noctowls.com/cdn/shop/files/07_1ed4576f-3063-4e2e-9f54-82fe31ad81d7.png?v=1764082348&width=823",
        "https://noctowls.com/cdn/shop/files/08_48f4b605-c26d-48ec-a55f-3db289702cd7.png?v=1764082347&width=823",
        "https://noctowls.com/cdn/shop/files/09_78f71ba7-d237-4538-8400-810744715094.png?v=1764082345&width=823",
        "https://noctowls.com/cdn/shop/files/10_c2ef1635-ac01-4f21-8745-e262e7a6d228.png?v=1764082346&width=823",
        "https://noctowls.com/cdn/shop/files/11_6d854a91-a125-409b-aee7-6562aef616e4.png?v=1764082345&width=823",
        "https://noctowls.com/cdn/shop/files/12_fb772405-75c7-4353-8701-a5f785391185.png?v=1764082347&width=823",
        "https://noctowls.com/cdn/shop/files/13_22ada8d0-273a-499c-aac2-b65bb05f72be.png?v=1764082344&width=823",
      ]
    },
    {
      id: 4,
      name: "chains of desire",
      sizes: [
        {
          value: "l",
          price: "649.00",
          originalPrice: "1,199.00"
        },
        {
          value: "xl",
          price: "849.00",
          originalPrice: "1,599.00"
        },
        {
          value: "2xl",
          price: "1,049.00",
          originalPrice: "1,899.00"
        },
      ],
      reviews: [
        {
          user: {
            name: "Test User",
            review: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."
          },
          user: {
            name: "Test User 2",
            review: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."
          },
          user: {
            name: "Test User 3",
            review: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."
          },
          user: {
            name: "Test User 4",
            review: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."
          },
          user: {
            name: "Test User 5",
            review: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."
          },
        }
      ],
      rating: 4.5,
      images: [
        "https://noctowls.com/cdn/shop/files/01_02ea59d5-e679-4400-85f1-89b62b8772ac.png?v=1764082348&width=823",
        "https://noctowls.com/cdn/shop/files/02.png?v=1764082347&width=823",
        "https://noctowls.com/cdn/shop/files/03.png?v=1764082348&width=823",
        "https://noctowls.com/cdn/shop/files/04.png?v=1764082349&width=823",
        "https://noctowls.com/cdn/shop/files/05.png?v=1764082349&width=823",
        "https://noctowls.com/cdn/shop/files/06.png?v=1764082348&width=823",
        "https://noctowls.com/cdn/shop/files/07_1ed4576f-3063-4e2e-9f54-82fe31ad81d7.png?v=1764082348&width=823",
        "https://noctowls.com/cdn/shop/files/08_48f4b605-c26d-48ec-a55f-3db289702cd7.png?v=1764082347&width=823",
        "https://noctowls.com/cdn/shop/files/09_78f71ba7-d237-4538-8400-810744715094.png?v=1764082345&width=823",
        "https://noctowls.com/cdn/shop/files/10_c2ef1635-ac01-4f21-8745-e262e7a6d228.png?v=1764082346&width=823",
        "https://noctowls.com/cdn/shop/files/11_6d854a91-a125-409b-aee7-6562aef616e4.png?v=1764082345&width=823",
        "https://noctowls.com/cdn/shop/files/12_fb772405-75c7-4353-8701-a5f785391185.png?v=1764082347&width=823",
        "https://noctowls.com/cdn/shop/files/13_22ada8d0-273a-499c-aac2-b65bb05f72be.png?v=1764082344&width=823",
      ]
    },
    {
      id: 5,
      name: "chains of desire",
      sizes: [
        {
          value: "l",
          price: "649.00",
          originalPrice: "1,199.00"
        },
        {
          value: "xl",
          price: "849.00",
          originalPrice: "1,599.00"
        },
        {
          value: "2xl",
          price: "1,049.00",
          originalPrice: "1,899.00"
        },
      ],
      reviews: [
        {
          user: {
            name: "Test User",
            review: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."
          },
          user: {
            name: "Test User 2",
            review: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."
          },
          user: {
            name: "Test User 3",
            review: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."
          },
          user: {
            name: "Test User 4",
            review: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."
          },
          user: {
            name: "Test User 5",
            review: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."
          },
        }
      ],
      rating: 4.5,
      images: [
        "https://noctowls.com/cdn/shop/files/01_02ea59d5-e679-4400-85f1-89b62b8772ac.png?v=1764082348&width=823",
        "https://noctowls.com/cdn/shop/files/02.png?v=1764082347&width=823",
        "https://noctowls.com/cdn/shop/files/03.png?v=1764082348&width=823",
        "https://noctowls.com/cdn/shop/files/04.png?v=1764082349&width=823",
        "https://noctowls.com/cdn/shop/files/05.png?v=1764082349&width=823",
        "https://noctowls.com/cdn/shop/files/06.png?v=1764082348&width=823",
        "https://noctowls.com/cdn/shop/files/07_1ed4576f-3063-4e2e-9f54-82fe31ad81d7.png?v=1764082348&width=823",
        "https://noctowls.com/cdn/shop/files/08_48f4b605-c26d-48ec-a55f-3db289702cd7.png?v=1764082347&width=823",
        "https://noctowls.com/cdn/shop/files/09_78f71ba7-d237-4538-8400-810744715094.png?v=1764082345&width=823",
        "https://noctowls.com/cdn/shop/files/10_c2ef1635-ac01-4f21-8745-e262e7a6d228.png?v=1764082346&width=823",
        "https://noctowls.com/cdn/shop/files/11_6d854a91-a125-409b-aee7-6562aef616e4.png?v=1764082345&width=823",
        "https://noctowls.com/cdn/shop/files/12_fb772405-75c7-4353-8701-a5f785391185.png?v=1764082347&width=823",
        "https://noctowls.com/cdn/shop/files/13_22ada8d0-273a-499c-aac2-b65bb05f72be.png?v=1764082344&width=823",
      ]
    },
    {
      id: 6,
      name: "chains of desire",
      sizes: [
        {
          value: "l",
          price: "649.00",
          originalPrice: "1,199.00"
        },
        {
          value: "xl",
          price: "849.00",
          originalPrice: "1,599.00"
        },
        {
          value: "2xl",
          price: "1,049.00",
          originalPrice: "1,899.00"
        },
      ],
      reviews: [
        {
          user: {
            name: "Test User",
            review: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."
          },
          user: {
            name: "Test User 2",
            review: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."
          },
          user: {
            name: "Test User 3",
            review: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."
          },
          user: {
            name: "Test User 4",
            review: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."
          },
          user: {
            name: "Test User 5",
            review: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."
          },
        }
      ],
      rating: 4.5,
      images: [
        "https://noctowls.com/cdn/shop/files/01_02ea59d5-e679-4400-85f1-89b62b8772ac.png?v=1764082348&width=823",
        "https://noctowls.com/cdn/shop/files/02.png?v=1764082347&width=823",
        "https://noctowls.com/cdn/shop/files/03.png?v=1764082348&width=823",
        "https://noctowls.com/cdn/shop/files/04.png?v=1764082349&width=823",
        "https://noctowls.com/cdn/shop/files/05.png?v=1764082349&width=823",
        "https://noctowls.com/cdn/shop/files/06.png?v=1764082348&width=823",
        "https://noctowls.com/cdn/shop/files/07_1ed4576f-3063-4e2e-9f54-82fe31ad81d7.png?v=1764082348&width=823",
        "https://noctowls.com/cdn/shop/files/08_48f4b605-c26d-48ec-a55f-3db289702cd7.png?v=1764082347&width=823",
        "https://noctowls.com/cdn/shop/files/09_78f71ba7-d237-4538-8400-810744715094.png?v=1764082345&width=823",
        "https://noctowls.com/cdn/shop/files/10_c2ef1635-ac01-4f21-8745-e262e7a6d228.png?v=1764082346&width=823",
        "https://noctowls.com/cdn/shop/files/11_6d854a91-a125-409b-aee7-6562aef616e4.png?v=1764082345&width=823",
        "https://noctowls.com/cdn/shop/files/12_fb772405-75c7-4353-8701-a5f785391185.png?v=1764082347&width=823",
        "https://noctowls.com/cdn/shop/files/13_22ada8d0-273a-499c-aac2-b65bb05f72be.png?v=1764082344&width=823",
      ]
    },
    {
      id: 7,
      name: "chains of desire",
      sizes: [
        {
          value: "l",
          price: "649.00",
          originalPrice: "1,199.00"
        },
        {
          value: "xl",
          price: "849.00",
          originalPrice: "1,599.00"
        },
        {
          value: "2xl",
          price: "1,049.00",
          originalPrice: "1,899.00"
        },
      ],
      reviews: [
        {
          user: {
            name: "Test User",
            review: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."
          },
          user: {
            name: "Test User 2",
            review: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."
          },
          user: {
            name: "Test User 3",
            review: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."
          },
          user: {
            name: "Test User 4",
            review: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."
          },
          user: {
            name: "Test User 5",
            review: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."
          },
        }
      ],
      rating: 4.5,
      images: [
        "https://noctowls.com/cdn/shop/files/01_02ea59d5-e679-4400-85f1-89b62b8772ac.png?v=1764082348&width=823",
        "https://noctowls.com/cdn/shop/files/02.png?v=1764082347&width=823",
        "https://noctowls.com/cdn/shop/files/03.png?v=1764082348&width=823",
        "https://noctowls.com/cdn/shop/files/04.png?v=1764082349&width=823",
        "https://noctowls.com/cdn/shop/files/05.png?v=1764082349&width=823",
        "https://noctowls.com/cdn/shop/files/06.png?v=1764082348&width=823",
        "https://noctowls.com/cdn/shop/files/07_1ed4576f-3063-4e2e-9f54-82fe31ad81d7.png?v=1764082348&width=823",
        "https://noctowls.com/cdn/shop/files/08_48f4b605-c26d-48ec-a55f-3db289702cd7.png?v=1764082347&width=823",
        "https://noctowls.com/cdn/shop/files/09_78f71ba7-d237-4538-8400-810744715094.png?v=1764082345&width=823",
        "https://noctowls.com/cdn/shop/files/10_c2ef1635-ac01-4f21-8745-e262e7a6d228.png?v=1764082346&width=823",
        "https://noctowls.com/cdn/shop/files/11_6d854a91-a125-409b-aee7-6562aef616e4.png?v=1764082345&width=823",
        "https://noctowls.com/cdn/shop/files/12_fb772405-75c7-4353-8701-a5f785391185.png?v=1764082347&width=823",
        "https://noctowls.com/cdn/shop/files/13_22ada8d0-273a-499c-aac2-b65bb05f72be.png?v=1764082344&width=823",
      ]
    },
    {
      id: 8,
      name: "chains of desire",
      sizes: [
        {
          value: "l",
          price: "649.00",
          originalPrice: "1,199.00"
        },
        {
          value: "xl",
          price: "849.00",
          originalPrice: "1,599.00"
        },
        {
          value: "2xl",
          price: "1,049.00",
          originalPrice: "1,899.00"
        },
      ],
      reviews: [
        {
          user: {
            name: "Test User",
            review: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."
          },
          user: {
            name: "Test User 2",
            review: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."
          },
          user: {
            name: "Test User 3",
            review: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."
          },
          user: {
            name: "Test User 4",
            review: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."
          },
          user: {
            name: "Test User 5",
            review: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."
          },
        }
      ],
      rating: 4.5,
      images: [
        "https://noctowls.com/cdn/shop/files/01_02ea59d5-e679-4400-85f1-89b62b8772ac.png?v=1764082348&width=823",
        "https://noctowls.com/cdn/shop/files/02.png?v=1764082347&width=823",
        "https://noctowls.com/cdn/shop/files/03.png?v=1764082348&width=823",
        "https://noctowls.com/cdn/shop/files/04.png?v=1764082349&width=823",
        "https://noctowls.com/cdn/shop/files/05.png?v=1764082349&width=823",
        "https://noctowls.com/cdn/shop/files/06.png?v=1764082348&width=823",
        "https://noctowls.com/cdn/shop/files/07_1ed4576f-3063-4e2e-9f54-82fe31ad81d7.png?v=1764082348&width=823",
        "https://noctowls.com/cdn/shop/files/08_48f4b605-c26d-48ec-a55f-3db289702cd7.png?v=1764082347&width=823",
        "https://noctowls.com/cdn/shop/files/09_78f71ba7-d237-4538-8400-810744715094.png?v=1764082345&width=823",
        "https://noctowls.com/cdn/shop/files/10_c2ef1635-ac01-4f21-8745-e262e7a6d228.png?v=1764082346&width=823",
        "https://noctowls.com/cdn/shop/files/11_6d854a91-a125-409b-aee7-6562aef616e4.png?v=1764082345&width=823",
        "https://noctowls.com/cdn/shop/files/12_fb772405-75c7-4353-8701-a5f785391185.png?v=1764082347&width=823",
        "https://noctowls.com/cdn/shop/files/13_22ada8d0-273a-499c-aac2-b65bb05f72be.png?v=1764082344&width=823",
      ]
    },
    {
      id: 9,
      name: "chains of desire",
      sizes: [
        {
          value: "l",
          price: "649.00",
          originalPrice: "1,199.00"
        },
        {
          value: "xl",
          price: "849.00",
          originalPrice: "1,599.00"
        },
        {
          value: "2xl",
          price: "1,049.00",
          originalPrice: "1,899.00"
        },
      ],
      reviews: [
        {
          user: {
            name: "Test User",
            review: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."
          },
          user: {
            name: "Test User 2",
            review: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."
          },
          user: {
            name: "Test User 3",
            review: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."
          },
          user: {
            name: "Test User 4",
            review: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."
          },
          user: {
            name: "Test User 5",
            review: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."
          },
        }
      ],
      rating: 4.5,
      images: [
        "https://noctowls.com/cdn/shop/files/01_02ea59d5-e679-4400-85f1-89b62b8772ac.png?v=1764082348&width=823",
        "https://noctowls.com/cdn/shop/files/02.png?v=1764082347&width=823",
        "https://noctowls.com/cdn/shop/files/03.png?v=1764082348&width=823",
        "https://noctowls.com/cdn/shop/files/04.png?v=1764082349&width=823",
        "https://noctowls.com/cdn/shop/files/05.png?v=1764082349&width=823",
        "https://noctowls.com/cdn/shop/files/06.png?v=1764082348&width=823",
        "https://noctowls.com/cdn/shop/files/07_1ed4576f-3063-4e2e-9f54-82fe31ad81d7.png?v=1764082348&width=823",
        "https://noctowls.com/cdn/shop/files/08_48f4b605-c26d-48ec-a55f-3db289702cd7.png?v=1764082347&width=823",
        "https://noctowls.com/cdn/shop/files/09_78f71ba7-d237-4538-8400-810744715094.png?v=1764082345&width=823",
        "https://noctowls.com/cdn/shop/files/10_c2ef1635-ac01-4f21-8745-e262e7a6d228.png?v=1764082346&width=823",
        "https://noctowls.com/cdn/shop/files/11_6d854a91-a125-409b-aee7-6562aef616e4.png?v=1764082345&width=823",
        "https://noctowls.com/cdn/shop/files/12_fb772405-75c7-4353-8701-a5f785391185.png?v=1764082347&width=823",
        "https://noctowls.com/cdn/shop/files/13_22ada8d0-273a-499c-aac2-b65bb05f72be.png?v=1764082344&width=823",
      ]
    },
  ]

  return (
    <section className='grid grid-cols-2 gap-x-4 gap-y-8 px-4 pt-20 pb-10' id='home-product-section'>
      {
        data.map(product => (
          <Link to={`/products/${product.id}`}>
            <ProductListItem key={`${product.id}-listing-key`} product={product} />
          </Link>
        ))
      }
    </section>
  )
}

export default HomeProductSection