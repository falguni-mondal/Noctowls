const userDataTrimmer = (user) => {
    const {_id, email, isVerified, role, address} = user;
    return { id: _id, email, isVerified, role, address}
}

export default userDataTrimmer;