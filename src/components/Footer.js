import React from 'react';

const Footer = () => {
    return (
        <footer className="bg-white dark:bg-gray-900 w-full mt-auto">
            <div className="container flex items-center justify-center p-4 mx-auto">
                <p className="text-sm text-gray-600 dark:text-gray-300 text-center">
                    © {new Date().getFullYear()} . All Rights Reserved.
                </p>
            </div>
        </footer>
    );
};

export default Footer;
