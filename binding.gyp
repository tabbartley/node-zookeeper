{
    'variables': {
        'platform': '<(OS)',
    },
    "targets": [{
        "target_name": "zookeeper",
        'dependencies': ['libzk'],
        "sources": ["src/node-zk.cpp"],
        'cflags': ['-Wall', '-O0'],
        'conditions': [
            ['OS=="solaris"', {
                'cflags': ['-Wno-strict-aliasing'],
                'defines': ['_POSIX_PTHREAD_SEMANTICS'],
                'include_dirs': [
                    '/opt/local/include/zookeeper',
                    '<!(node -e "require(\'nan\')")'
                ],
	            'ldflags': ['-lzookeeper_st'],
            }],
            ['OS=="mac"',{
                'include_dirs': [
                    '<(module_root_dir)/deps/zookeeper/src/c/include',
                    '<(module_root_dir)/deps/zookeeper/src/c/generated',
                    '<!(node -e "require(\'nan\')")'
                ],
                'libraries': ['<(module_root_dir)/deps/zookeeper/src/c/.libs/libzookeeper_st.a'],
                'xcode_settings': {
                    'GCC_ENABLE_CPP_EXCEPTIONS': 'YES',
                    'MACOSX_DEPLOYMENT_TARGET': '<!(sw_vers -productVersion)'
                }
            }],['OS=="linux"',{
                'include_dirs': [
                    '<(module_root_dir)/deps/zookeeper/src/c/include',
                    '<(module_root_dir)/deps/zookeeper/src/c/generated',
                    '<!(node -e "require(\'nan\')")'
                ],
                'libraries': ['<(module_root_dir)/deps/zookeeper/src/c/.libs/libzookeeper_st.a'],
            }],['OS=="win"',{
                'defines': ['WIN32', 'USE_STATIC_LIB', 'THREADED'],
                'msvs_settings': {
                    'VCLinkerTool':{
                        'IgnoreDefaultLibraryNames': ['msvcrtd.lib', 'msvcmrtd.lib', 'libcmt.lib'],
                    }
                },
                'include_dirs': [
                    '<(module_root_dir)/deps/zookeeper/src/c/include',
                    '<(module_root_dir)/deps/zookeeper/src/c/generated',
                    '<!(node -e "require(\'nan\')")'
                ],
                'libraries': [
                    '<(module_root_dir)/deps/zookeeper/src/c/Debug/zookeeper.lib',
                    '<(module_root_dir)/deps/zookeeper/src/c/Debug/hashtable.lib',
                    'msvcrt.lib',
                    'msvcmrt.lib'
                ],
            }]
        ]},
        {
            'target_name': 'libzk',
            'type': 'none',
            'actions': [{
                'action_name': 'build_zk_client_lib',
                'inputs': [''],
                'outputs': [''],
                'action': ['node', 'scripts/build.js']
            }]
        },
        {
            "target_name": "after_build",
            "type": "none",
            "dependencies": ["zookeeper"],
            "actions": [{
                "action_name": "symlink",
                "inputs": ["<@(PRODUCT_DIR)/zookeeper.node"],
                "outputs": ["<(module_root_dir)/build/zookeeper.node"],
                "action": ["node", "scripts/symlink.js", "<@(_inputs)"]
            }]
    }],
}
