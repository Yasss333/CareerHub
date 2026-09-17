import React from 'react';

const Footer = () => {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');

        * {
          font-family: 'Poppins', sans-serif;
        }
      `}</style>

      <footer className='flex flex-wrap justify-center lg:justify-between overflow-hidden gap-10 md:gap-20 py-16 px-6 md:px-16 lg:px-24 xl:px-32 text-[13px] text-gray-500 bg-gradient-to-r from-white via-green-200/60 to-white mt-40'>
        <div className='flex flex-wrap items-start gap-10 md:gap-[60px] xl:gap-[140px]'>
          <a href='#'>
            <img src='/logo.svg' alt='logo' className='h-11 w-auto' />
          </a>

          <div>
            <p className='text-slate-800 font-semibold'>Product</p>
            <ul className='mt-2 space-y-2'>
              <li><a href='/' className='hover:text-green-600 transition'>Home</a></li>
              <li><a href='/' className='hover:text-green-600 transition'>Support</a></li>
              <li><a href='/' className='hover:text-green-600 transition'>Pricing</a></li>
              <li><a href='/' className='hover:text-green-600 transition'>Affiliate</a></li>
            </ul>
          </div>

          <div>
            <p className='text-slate-800 font-semibold'>Resources</p>
            <ul className='mt-2 space-y-2'>
              <li><a href='/' className='hover:text-green-600 transition'>Company</a></li>
              <li><a href='/' className='hover:text-green-600 transition'>Blogs</a></li>
              <li><a href='/' className='hover:text-green-600 transition'>Community</a></li>
              <li><a href='/' className='hover:text-green-600 transition'>Careers</a></li>
              <li><a href='/' className='hover:text-green-600 transition'>About</a></li>
            </ul>
          </div>

          <div>
            <p className='text-slate-800 font-semibold'>Legal</p>
            <ul className='mt-2 space-y-2'>
              <li><a href='/' className='hover:text-green-600 transition'>Privacy</a></li>
              <li><a href='/' className='hover:text-green-600 transition'>Terms</a></li>
            </ul>
          </div>
        </div>

        <div className='flex flex-col max-md:items-center max-md:text-center gap-2 items-end'>
          <p className='max-w-60'>Build better resumes faster with smart AI and clean templates.</p>

          <p className='mt-3 text-center'>
            Made with 💘 by Yash{' '}
            <a
              href='https://github.com/Yasss333'
              target='_blank'
              rel='noreferrer'
              className='text-green-700 hover:text-green-900 font-semibold'
            >
              github.com/Yasss333
            </a>
          </p>
        </div>
      </footer>
    </>
  );
};

export default Footer;
