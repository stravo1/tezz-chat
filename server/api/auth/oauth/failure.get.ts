export default defineEventHandler((event) => {
    // Redirect to login page with error
    return sendRedirect(event, '/auth/login?error=oauth_failed');
}); 