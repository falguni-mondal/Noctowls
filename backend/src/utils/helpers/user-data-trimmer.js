const userDataTrimmer = (user) => {
    const {_id, name, email, isVerified, role, address} = user;
    return { id: _id, name, email, isVerified, role, address}
}

export default userDataTrimmer;