

const apiUrl = "http://localhost:3000"

export const addPlayer = async (gameId, playerId) => {
    const res = await fetch(
        `${apiUrl}/api/addPlayer/${gameId}/players/${playerId}`,
        {
            method: "PUT",
            body: JSON.stringify({ name: playerId }),
        }
    );
    return await res.json();
}