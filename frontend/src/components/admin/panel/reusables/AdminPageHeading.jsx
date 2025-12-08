import { Icon } from '@iconify/react'

const AdminPageHeading = ({ icon, text }) => {
    return (
        <h1 className='text-xl text-[#1a1a1a] flex items-center gap-1 font-medium'>
            <Icon icon={icon} className='admin-heading-icon text-2xl' />
            <p className='admin-heading-text capitalize'>{text}</p>
        </h1>
    )
}

export default AdminPageHeading
