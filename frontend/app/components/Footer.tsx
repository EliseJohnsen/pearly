"use client";

import { useFooter, useFooterPages } from "../hooks/useSanityData";

interface FooterProps {
  data?: any,
  footerPages?: any
}

export default function Footer({ data, footerPages }: FooterProps = {}) {
    const {data: fetchedFooter} = useFooter();
    // const {footerPages: fetchedFooterPages} = useFooterPages();

    const footer = data || fetchedFooter;
    return (
        <footer className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            {footer && footer.companyInfo && (
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    {footer.companyInfo.companyName}
                </h2>
            )}
        </footer>
    )
}
