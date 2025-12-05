const adminDataTrimmer = (admin) => {
    const { email, isVerified, role} = admin;
    return { email, isVerified, role }
}

export default adminDataTrimmer;