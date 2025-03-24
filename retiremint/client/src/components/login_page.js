import React from 'react';
import Header from './header';

function LoginPage({ set_current_page }) {
    return (
        <div>
            <script src="https://accounts.google.com/gsi/client" async></script>
            <Header />
            <div id="g_id_onload"
                data-client_id="682091940238-s9o9l1c59f1ucofl0mle0gn7k9vfp2cu.apps.googleusercontent.com"
                data-context="signin"
                data-ux_mode="popup"
                data-login_uri='http://localhost:8000/login'
                data-auto_prompt="false">
            </div>

            <div class="g_id_signin"
                data-type="standard"
                data-shape="pill"
                data-theme="filled_blue"
                data-text="signin_with"
                data-size="large"
                data-logo_alignment="left">
            </div>

            <button onClick={() => set_current_page('new_scenario')}>
                Create a New Scenario as Guest
            </button>
        </div>
    );
}

export default LoginPage;
