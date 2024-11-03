// API endpoint to handle adding track requests from Twitch bot
export default function handler(req, res) {
    if (req.method === 'POST') {
        const { url, user } = req.body; // Extract the track URL and username from the request body

        if (!url || !user) {
            res.status(400).json({ message: 'Missing URL or user information' }); // Respond with error if data is incomplete
            return;
        }

        // Log the received track information
        console.log(`Track received from ${user}: ${url}`);

        // Example logic to handle the track, like adding to a database or updating a list
        // Here, we're assuming that track details are handled and saved appropriately.
        // You can modify this part to integrate with your backend as needed.

        // Send success response
        res.status(200).json({ message: 'Track added successfully' });
    } else {
        res.status(405).json({ message: 'Method Not Allowed' }); // Only POST requests are allowed
    }
}
