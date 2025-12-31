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

    const handleEmailClick = () => {
        if (footer?.companyInfo?.email) {
            navigator.clipboard.writeText(footer.companyInfo.email);
        }
    };

    return (
        <footer className="bg-purple shadow-lg p-8">
            {footer && footer.companyInfo && (
                <h2 className="text-xl font-bold text-white text-center">
                    <a
                        href={`mailto:${footer.companyInfo.email}`}
                        onClick={handleEmailClick}
                        className="hover:text-blue-600 transition-colors"
                        title="Åpner epost og kopierer epost-adressen til utklippstavle"
                    >
                        {footer.companyInfo.email}
                    </a>
                </h2>
            )}
        </footer>
    )
}
