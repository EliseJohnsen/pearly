"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";
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

    const [openSection, setOpenSection] = useState<number | null>(null);
    const toggleSection = (i: number) => setOpenSection(openSection === i ? null : i);

    const handleEmailClick = () => {
        if (footer?.companyInfo?.email) {
            navigator.clipboard.writeText(footer.companyInfo.email);
        }
    };

    return (
        <footer className="bg-dark-purple shadow-lg p-8 text-footer-text">
            <div className="flex flex-col tablet:flex-row tablet:flex-wrap tablet:justify-between mb-0 tablet:mb-8">
                <div className="mb-6 tablet:mb-0">
                    <Link href="/">
                        <img
                            src="/Pearly_navnetrekk 1.svg"
                            alt="Pearly logo"
                            className="h-12 md:h-[48px]"
                        />
                    </Link>
                </div>
                <div className="tablet:hidden w-full bg-footer-text mb-4" style={{ height: '0.5px' }} />
                {/* Mobile accordion / Desktop columns */}
                <div className="w-full tablet:w-auto tablet:flex tablet:flex-wrap tablet:justify-between tablet:gap-8">

                    {/* Column 1 */}
                    <div className="tablet:w-48 tablet:flex-auto">
                        <button
                            className="w-full flex items-center justify-between py-3 tablet:hidden"
                            onClick={() => toggleSection(0)}
                        >
                            <span className="text-base font-semibold">{column1Header}</span>
                            {openSection === 0 ? <ChevronUpIcon className="w-5 h-5" /> : <ChevronDownIcon className="w-5 h-5" />}
                        </button>
                        {column1Header && (
                            <p className="hidden tablet:block text-base my-2">{column1Header}</p>
                        )}
                        <ul className={`text-white pb-3 tablet:pb-0 ${openSection === 0 ? 'block' : 'hidden'} tablet:block`}>
                            {pages?.filter((page: any) => page.footerOrder > 10 && page.footerOrder < 20).map((page: any) => (
                                <li key={page._id}>
                                    <Link href={`/${page.slug.current}`} className="hover:text-primary transition-colors">
                                        {page.title}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Column 2 */}
                    <div className="tablet:w-48 tablet:flex-auto">
                        <button
                            className="w-full flex items-center justify-between py-3 tablet:hidden"
                            onClick={() => toggleSection(1)}
                        >
                            <span className="text-base font-semibold">{column2Header}</span>
                            {openSection === 1 ? <ChevronUpIcon className="w-5 h-5" /> : <ChevronDownIcon className="w-5 h-5" />}
                        </button>
                        {column2Header && (
                            <p className="hidden tablet:block text-base my-2">{column2Header}</p>
                        )}
                        <ul className={`text-white pb-3 tablet:pb-0 ${openSection === 1 ? 'block' : 'hidden'} tablet:block`}>
                            {pages?.filter((page: any) => page.footerOrder > 20 && page.footerOrder < 30).map((page: any) => (
                                <li key={page._id}>
                                    <Link href={`/${page.slug.current}`} className="hover:text-primary transition-colors">
                                        {page.title}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Column 3 */}
                    <div className="tablet:w-48 tablet:flex-auto">
                        <button
                            className="w-full flex items-center justify-between py-3 tablet:hidden"
                            onClick={() => toggleSection(2)}
                        >
                            <span className="text-base font-semibold">{column3Header}</span>
                            {openSection === 2 ? <ChevronUpIcon className="w-5 h-5" /> : <ChevronDownIcon className="w-5 h-5" />}
                        </button>
                        {column3Header && (
                            <p className="hidden tablet:block text-base my-2">{column3Header}</p>
                        )}
                        <ul className={`text-white pb-3 tablet:pb-0 ${openSection === 2 ? 'block' : 'hidden'} tablet:block`}>
                            {footer && footer.companyInfo && footer.companyInfo.email && (
                                <li>
                                    <a
                                        href={`mailto:${footer.companyInfo.email}`}
                                        onClick={handleEmailClick}
                                        className="hover:text-primary transition-colors"
                                        title="Åpner epost og kopierer epost-adressen til utklippstavle"
                                    >
                                        {footer.companyInfo.email}
                                    </a>
                                </li>
                            )}
                            <li>
                                <a
                                    href="https://www.instagram.com/feel_pearly?igsh=MXM5ZG80bmxuYmdlMA%3D%3D&utm_source=qr"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:text-primary transition-colors"
                                >
                                    Instagram
                                </a>
                            </li>
                            {pages?.filter((page: any) => page.footerOrder > 30 && page.footerOrder < 40).map((page: any) => (
                                <li key={page._id}>
                                    <Link href={`/${page.slug.current}`} className="hover:text-primary transition-colors">
                                        {page.title}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                </div>
            </div>
            <div className="my-4 w-full bg-footer-text" style={{ height: '0.5px' }} />
            {footer && footer.companyInfo && (
                <div className="flex flex-col tablet:flex-row tablet:justify-between">
                    <div className="order-2 tablet:order-1">
                        {footer.companyInfo.companyName} | {footer.additionalText}
                    </div>
                    <ul className="flex flex-col gap-2 tablet:gap-0 tablet:flex-row order-1 tablet:order-2 mb-2 tablet:mb-0">
                        {pages?.filter((page: any) => page.footerOrder > 40 && page.footerOrder < 50).map((page: any) => (
                            <li key={page._id} className="tablet:mx-2">
                                <Link
                                    href={`/${page.slug.current}`}
                                    className="underline hover:text-primary transition-colors"
                                >
                                    {page.title}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </footer>
    )
}
