import React from 'react';
import Image from 'next/image';
import LogoName from '@/../public/LogoName.png';

export function Header() {
	return (
		<header className="w-full bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600">
			<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				<div className="h-16 flex items-center">
					<div className="flex items-center">
						<Image src={LogoName} alt="Fabriqly" className="h-10 w-auto" priority />
					</div>
				</div>
			</div>
		</header>
	);
}

export default Header;
