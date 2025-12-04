import loading from "../../assets/loader/loading.gif"
const Loader = () => {
  return (
    <div className='fixed z-998 inset-0 bg-black flex justify-center items-center'>
        <img className='w-10 aspect-square' src={loading} alt="Loading.gif" />
    </div>
  )
}

export default Loader