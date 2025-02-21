export const getHeaders = () => {
    const token = localStorage.getItem("authorization");
    return {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
    };
};