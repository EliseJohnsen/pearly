"use client";

import Link from "next/link";
import { useFooter, useFooterPages, useUIString } from "../hooks/useSanityData";

interface FooterProps {
    data?: any,
    footerPages?: any
}

export default function Footer({ data, footerPages }: FooterProps = {}) {
    const { data: fetchedFooter } = useFooter();
    const { data: fetchedFooterPages } = useFooterPages();

    const column1Header = useUIString('footer_column_1_header').toUpperCase();
    const column2Header = useUIString('footer_column_2_header').toUpperCase();
    const column3Header = useUIString('footer_column_3_header').toUpperCase();

    const footer = data || fetchedFooter;
    const pages = footerPages || fetchedFooterPages;

    const handleEmailClick = () => {
        if (footer?.companyInfo?.email) {
            navigator.clipboard.writeText(footer.companyInfo.email);
        }
    };

    return (
        <footer className="bg-dark-purple shadow-lg p-8 text-white">
            <div className="flex flex-wrap justify-between mb-8">
                <div>
                    LOGO
                </div>
                <div className="flex flex-wrap justify-between">
                    <div className="w-48 flex-auto">
                        {column1Header && (
                            <p className="text-lg my-2">{column1Header}</p>
                        )}
                        <ul>
                            {pages?.filter((page: any) => page.footerOrder > 10 && page.footerOrder < 20).map((page: any) => (
                                <li key={page._id}>
                                    <Link
                                        href={`/${page.slug.current}`}
                                        className="hover:text-primary transition-colors"
                                    >
                                        {page.title}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="w-48 flex-auto">
                        {column2Header && (
                            <p className="text-lg my-2">{column2Header}</p>
                        )}
                        <ul>
                            {pages?.filter((page: any) => page.footerOrder > 20 && page.footerOrder < 30).map((page: any) => (
                                <li key={page._id}>
                                    <Link
                                        href={`/${page.slug.current}`}
                                        className="hover:text-primary transition-colors"
                                    >
                                        {page.title}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="w-48 flex-auto">
                        {column3Header && (
                            <p className="text-lg my-2">{column3Header}</p>
                        )}
                        <ul>
                            {footer && footer.companyInfo && footer.companyInfo.email && (
                                <li>
                                    <a
                                        href={`mailto:${footer.companyInfo.email}`}
                                        onClick={handleEmailClick}
                                        className="hover:text-black transition-colors"
                                        title="Åpner epost og kopierer epost-adressen til utklippstavle"
                                    >
                                        {footer.companyInfo.email}
                                    </a>
                                </li>
                            )}
                            {pages?.filter((page: any) => page.footerOrder > 30 && page.footerOrder < 40).map((page: any) => (
                                <li key={page._id}>
                                    <Link
                                        href={`/${page.slug.current}`}
                                        className="hover:text-primary transition-colors"
                                    >
                                        {page.title}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
            <hr className="p-4" />
            {footer && footer.companyInfo && (
                <div className="flex flex-wrap justify-between">
                    <div>
                        {footer.companyInfo.companyName} | {footer.additionalText}
                    </div>
                    <div className="">
                        <ul className="flex flex-wrap flex-column">
                            {pages?.filter((page: any) => page.footerOrder > 40 && page.footerOrder < 50).map((page: any) => (
                                <li key={page._id} className="mx-2">
                                    <Link
                                        href={`/${page.slug.current}`}
                                        className="hover:text-primary transition-colors"
                                    >
                                        {page.title}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </footer>
    )
}
