import loading from "../../assets/loader/loading1.gif"

const MiniLoading = () => {
  return (
    <div className='absolute h-full w-full top-0 left-0 flex justify-center items-center'>
        <img className="w-[30px] aspect-square" src={loading} alt="" />
    </div>
  )
}

export default MiniLoading