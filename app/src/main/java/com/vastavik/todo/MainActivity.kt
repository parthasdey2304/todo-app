package com.vastavik.todo

import android.app.DatePickerDialog
import android.app.TimePickerDialog
import android.content.Intent
import android.os.Bundle
import android.speech.RecognizerIntent
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.draw.scale
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.ktx.auth
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.ktx.firestore
import com.google.firebase.ktx.Firebase
import com.vastavik.todo.model.Project
import com.vastavik.todo.model.Task
import kotlinx.coroutines.delay
import java.text.SimpleDateFormat
import java.util.*

private val BrutalRect = RoundedCornerShape(0.dp)

// fonts
private val SpaceGrotesk = FontFamily(Font(R.font.space_grotesk, FontWeight.Normal), Font(R.font.space_grotesk, FontWeight.Bold), Font(R.font.space_grotesk, FontWeight.Black))
private val JetBrainsMono = FontFamily(Font(R.font.jetbrains_mono, FontWeight.Normal), Font(R.font.jetbrains_mono, FontWeight.Bold), Font(R.font.jetbrains_mono, FontWeight.Black))
private val SyneFamily = FontFamily(Font(R.font.syne, FontWeight.Normal), Font(R.font.syne, FontWeight.Bold), Font(R.font.syne, FontWeight.Black))

// palette
private val BrutalYellow = Color(0xFFFFE600)
private val BrutalCyan = Color(0xFF22D3EE)
private val BrutalPurple = Color(0xFFA78BFA)
private val BrutalRed = Color(0xFFFF3B30)
private val BrutalBlack = Color(0xFF000000)
private val BrutalWhite = Color(0xFFFFFFFF)
private val BrutalGreen = Color(0xFF22C55E)
private val BrutalOrange = Color(0xFFFF9A00)
private val BrutalPink = Color(0xFFFF6B9D)
private val BrutalDarkBg = Color(0xFF0A0A0A)

// ─── GLOBAL BRUTAL THEME (dark = existing, light = new) ─────────────────────
private val LocalBrutalIsDark = compositionLocalOf { true }
private val LocalBrutalAccentHex = compositionLocalOf { "#FFE600" }

@Composable private fun brutalBg(): Color {
    val isDark = LocalBrutalIsDark.current
    val accentHex = LocalBrutalAccentHex.current
    if (isDark) return BrutalDarkBg
    return when(accentHex){
        "#22D3EE" -> BrutalCyan
        "#A78BFA" -> BrutalPurple
        else -> BrutalYellow
    }
}
@Composable private fun brutalSurface(): Color {
    val isDark = LocalBrutalIsDark.current
    return if (isDark) Color(0xFF1A1A1A) else BrutalWhite
}
@Composable private fun brutalOnSurface(): Color {
    val isDark = LocalBrutalIsDark.current
    return if (isDark) BrutalYellow else BrutalBlack
}
@Composable private fun brutalOnBg(): Color {
    val isDark = LocalBrutalIsDark.current
    return if (isDark) BrutalYellow else BrutalBlack
}

private fun prioColor(p: String): Color = when(p) {
    "low" -> BrutalCyan
    "medium" -> BrutalYellow
    "high" -> BrutalOrange
    "urgent" -> BrutalRed
    else -> BrutalWhite
}
private fun projectBg(colorStr: String): Color = when {
    colorStr.contains("FFE600") -> BrutalYellow
    colorStr.contains("22D3EE") -> BrutalCyan
    colorStr.contains("A78BFA") -> BrutalPurple
    colorStr.contains("FF3B30") -> BrutalRed
    colorStr.contains("22C55E") -> BrutalGreen
    colorStr.contains("FF9A00") -> BrutalOrange
    colorStr.contains("FF6B9D") -> BrutalPink
    colorStr.contains("black") || colorStr.contains("000000") -> BrutalBlack
    else -> BrutalYellow
}

@Composable fun BrutalHashOverlay(modifier: Modifier = Modifier, opacity: Float = 0.05f) {
    Canvas(modifier = modifier.fillMaxSize()) {
        val w = size.width; val h = size.height
        val spacing = 12.dp.toPx()
        val stroke = 2.dp.toPx()
        var x = -h
        while (x < w + h) {
            drawLine(Color.Black.copy(alpha=opacity), Offset(x,0f), Offset(x+h,h), stroke)
            x+=spacing
        }
    }
}

@Composable fun rememberBrutalAnimations(): BrutalAnimations {
    val inf = rememberInfiniteTransition(label="brutal")
    val jitter by inf.animateFloat(-0.5f,0.5f, infiniteRepeatable(tween(120,easing=LinearEasing), RepeatMode.Reverse), label="jitter")
    val floatY by inf.animateFloat(0f,-6f, infiniteRepeatable(tween(1500,easing=FastOutSlowInEasing), RepeatMode.Reverse), label="float")
    val marqueeX by inf.animateFloat(0f,-2000f, infiniteRepeatable(tween(14000,easing=LinearEasing), RepeatMode.Restart), label="marquee")
    return BrutalAnimations(jitter,floatY,marqueeX)
}
class BrutalAnimations(val jitter: Float, val floatY: Float, val marqueeX: Float)

@Composable fun BrutalStampIn(content: @Composable ()->Unit){
    var visible by remember{ mutableStateOf(false) }
    LaunchedEffect(Unit){ delay(100); visible=true }
    val scale by animateFloatAsState(if(visible)1f else 2.5f, spring(dampingRatio=0.4f, stiffness=300f), label="stamp")
    val alpha by animateFloatAsState(if(visible)1f else 0f, tween(300), label="alpha")
    Box(Modifier.scale(scale).alpha(alpha)){ content() }
}

class MainActivity : ComponentActivity() {
    private val auth: FirebaseAuth by lazy { Firebase.auth }
    private val db = Firebase.firestore
    private var voiceInputResult = mutableStateOf("")

    private val speechRecognizerLauncher = registerForActivityResult(ActivityResultContracts.StartActivityForResult()){ result ->
        if(result.resultCode==RESULT_OK){
            val data = result.data?.getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS)
            voiceInputResult.value = data?.get(0)?:""
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme(colorScheme=darkColorScheme(background=BrutalYellow, surface=BrutalWhite, primary=BrutalBlack)){
                VastavikApp()
            }
        }
    }

    @Composable fun VastavikApp(){
        val context = LocalContext.current
        val prefs = remember { context.getSharedPreferences("vastavik_prefs", android.content.Context.MODE_PRIVATE) }
        // existing dark UI is default (true) — light is new option that must actually work
        var isDark by remember { mutableStateOf(prefs.getBoolean("brutal_is_dark", true)) }
        var accent by remember { mutableStateOf(prefs.getString("brutal_accent", "#FFE600") ?: "#FFE600") }

        // persist on change
        LaunchedEffect(isDark) { prefs.edit().putBoolean("brutal_is_dark", isDark).apply() }
        LaunchedEffect(accent) { prefs.edit().putString("brutal_accent", accent).apply() }

        // expose globally via CompositionLocal so brutalBg()/brutalSurface() react everywhere
        CompositionLocalProvider(LocalBrutalIsDark provides isDark, LocalBrutalAccentHex provides accent) {
            var firebaseUser by remember{ mutableStateOf(auth.currentUser) }
            var authLoading by remember{ mutableStateOf(true) }
            DisposableEffect(Unit){
                val listener = FirebaseAuth.AuthStateListener { a ->
                    firebaseUser = a.currentUser
                    authLoading = false
                }
                auth.addAuthStateListener(listener)
                firebaseUser = auth.currentUser
                authLoading = false
                onDispose{ auth.removeAuthStateListener(listener) }
            }
            if(authLoading){
                Box(Modifier.fillMaxSize().background(if(isDark) BrutalDarkBg else BrutalYellow), contentAlignment=Alignment.Center){
                    Text("LOADING VAULT...", fontFamily=JetBrainsMono, fontWeight=FontWeight.Black, letterSpacing=1.sp, color = if(isDark) BrutalYellow else BrutalBlack)
                }
                return@CompositionLocalProvider
            }
            if(firebaseUser==null){
                AuthScreen(isDark = isDark)
            } else {
                MainScreen(isDark = isDark, onToggleDark = { isDark = !isDark }, accent = accent, onAccentChange = { accent = it })
            }
        }
    }

    @Composable fun AuthScreen(isDark: Boolean){
        val context = LocalContext.current
        var email by remember{ mutableStateOf("") }
        var password by remember{ mutableStateOf("") }
        var isLogin by remember{ mutableStateOf(true) }
        var error by remember{ mutableStateOf("") }
        var loading by remember{ mutableStateOf(false) }

        Box(Modifier.fillMaxSize().background(if(isDark) BrutalDarkBg else BrutalYellow)){
            BrutalHashOverlay(opacity=0.04f)
            Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(16.dp), horizontalAlignment=Alignment.CenterHorizontally){
                // top marquee
                Box(Modifier.fillMaxWidth().height(28.dp).background(BrutalBlack).border(3.dp, BrutalBlack)){
                    val anims = rememberBrutalAnimations()
                    Row(Modifier.offset{ IntOffset(anims.marqueeX.dp.roundToPx(),0)}){
                        Text("◆ VASTAVIK TODO — BRUTAL TASK MACHINE — ZERO RADIUS — THICK BORDERS — MANGA TYPE — ".repeat(3), fontFamily=JetBrainsMono, fontSize=10.sp, fontWeight=FontWeight.Black, color=BrutalYellow, letterSpacing=1.sp, maxLines=1)
                    }
                }
                Spacer(Modifier.height(12.dp))
                Box(Modifier.fillMaxWidth().shadow(6.dp, shape=BrutalRect).background(BrutalWhite).border(4.dp, BrutalBlack).padding(16.dp)){
                    Column(horizontalAlignment=Alignment.CenterHorizontally){
                        Box(Modifier.background(BrutalBlack).border(3.dp, BrutalBlack).padding(horizontal=8.dp, vertical=4.dp)){
                            Text("VASTAVIK TODO", fontFamily=SyneFamily, fontWeight=FontWeight.Black, fontSize=22.sp, color=BrutalWhite, letterSpacing=(-1).sp)
                        }
                        Spacer(Modifier.height(4.dp))
                        Text("BRUTAL • FUNKY • MANGA", fontFamily=JetBrainsMono, fontSize=10.sp, fontWeight=FontWeight.Black, color=BrutalBlack.copy(0.6f), letterSpacing=2.sp)
                        Spacer(Modifier.height(12.dp))
                        Box(Modifier.fillMaxWidth().height(4.dp).background(BrutalBlack))
                        Spacer(Modifier.height(12.dp))
                        Text(if(isLogin) "SIGN IN — TERMINAL 01" else "CREATE ACCOUNT — ENTER VOID", fontFamily=JetBrainsMono, fontWeight=FontWeight.Black, fontSize=14.sp, color=BrutalBlack)
                        if(error.isNotEmpty()){
                            Spacer(Modifier.height(8.dp))
                            Box(Modifier.fillMaxWidth().background(BrutalRed).border(3.dp, BrutalBlack).padding(8.dp)){
                                Text("⚠ $error", color=BrutalWhite, fontFamily=JetBrainsMono, fontSize=11.sp, fontWeight=FontWeight.Black)
                            }
                        }
                        Spacer(Modifier.height(12.dp))
                        OutlinedTextField(value=email, onValueChange={email=it; error=""}, label={Text("EMAIL", fontFamily=JetBrainsMono, fontWeight=FontWeight.Black, fontSize=10.sp)}, modifier=Modifier.fillMaxWidth().border(3.dp, BrutalBlack), colors=OutlinedTextFieldDefaults.colors(focusedBorderColor=BrutalBlack, unfocusedBorderColor=BrutalBlack, focusedContainerColor=BrutalYellow.copy(0.2f)))
                        Spacer(Modifier.height(8.dp))
                        OutlinedTextField(value=password, onValueChange={password=it; error=""}, label={Text("PASSWORD", fontFamily=JetBrainsMono, fontWeight=FontWeight.Black, fontSize=10.sp)}, modifier=Modifier.fillMaxWidth().border(3.dp, BrutalBlack), colors=OutlinedTextFieldDefaults.colors(focusedBorderColor=BrutalBlack, unfocusedBorderColor=BrutalBlack, focusedContainerColor=BrutalYellow.copy(0.2f)))
                        Spacer(Modifier.height(12.dp))
                        Box(Modifier.fillMaxWidth().height(48.dp).background(BrutalBlack).border(4.dp, BrutalBlack).clickable{
                            if(email.isBlank() || password.length<6){ error="EMAIL + 6 CHAR PASSWORD REQUIRED"; return@clickable }
                            loading=true
                            if(isLogin){
                                auth.signInWithEmailAndPassword(email.trim(), password).addOnCompleteListener{ t ->
                                    loading=false
                                    if(!t.isSuccessful) error=t.exception?.message ?: "LOGIN FAILED"
                                }
                            } else {
                                auth.createUserWithEmailAndPassword(email.trim(), password).addOnCompleteListener{ t ->
                                    loading=false
                                    if(!t.isSuccessful) error=t.exception?.message ?: "SIGNUP FAILED"
                                }
                            }
                        }, contentAlignment=Alignment.Center){
                            Text(if(loading) "LOADING..." else if(isLogin) "SIGN IN — GO!" else "CREATE — SLAM IT!", fontFamily=JetBrainsMono, fontWeight=FontWeight.Black, color=BrutalYellow, letterSpacing=1.sp)
                        }
                        Spacer(Modifier.height(8.dp))
                        TextButton(onClick={ isLogin = !isLogin; error=""}){
                            Text(if(isLogin) "NEED ACCOUNT? CREATE ONE" else "HAVE ACCOUNT? SIGN IN", fontFamily=JetBrainsMono, fontWeight=FontWeight.Black, fontSize=11.sp, color=BrutalBlack)
                        }
                        Spacer(Modifier.height(4.dp))
                        Row(Modifier.fillMaxWidth(), horizontalArrangement=Arrangement.spacedBy(6.dp)){
                            Box(Modifier.weight(1f).height(3.dp).background(BrutalYellow).border(2.dp, BrutalBlack))
                            Box(Modifier.weight(1f).height(3.dp).background(BrutalCyan).border(2.dp, BrutalBlack))
                            Box(Modifier.weight(1f).height(3.dp).background(BrutalPurple).border(2.dp, BrutalBlack))
                        }
                    }
                }
                Spacer(Modifier.height(12.dp))
                Box(Modifier.fillMaxWidth().background(BrutalBlack).border(3.dp, BrutalBlack).padding(10.dp), contentAlignment=Alignment.Center){
                    Text("© 2026 VASTAVIK — BRUTALISM IS NOT A TREND. IT'S A WARNING.", fontFamily=JetBrainsMono, fontSize=8.sp, color=BrutalYellow, fontWeight=FontWeight.Black)
                }
            }
        }
    }

    @Composable fun MainScreen(isDark: Boolean, onToggleDark: ()->Unit, accent: String, onAccentChange: (String)->Unit){
        val navController = rememberNavController()
        var selectedDate by remember{ mutableStateOf(Date()) }
        var tasks by remember{ mutableStateOf(listOf<Task>()) }
        var projects by remember{ mutableStateOf(listOf<Project>()) }
        var hasEverHadTasks by remember{ mutableStateOf<Boolean?>(null) }
        var searchOpen by remember{ mutableStateOf(false) }
        var searchQuery by remember{ mutableStateOf("") }
        val anims = rememberBrutalAnimations()
        val user = auth.currentUser
        val accentColor = when(accent){
            "#22D3EE" -> BrutalCyan
            "#A78BFA" -> BrutalPurple
            else -> BrutalYellow
        }

        // tasks listener
        LaunchedEffect(user?.uid){
            val u = user ?: return@LaunchedEffect
            val reg = db.collection("tasks").whereEqualTo("userId", u.uid).addSnapshotListener{ snap, _ ->
                if(snap!=null){
                    val fetched = snap.documents.mapNotNull{ it.toObject(Task::class.java) }.sortedByDescending{ it.createdAt?.time ?: it.order }
                    tasks = fetched
                    if(hasEverHadTasks==null) hasEverHadTasks = fetched.isNotEmpty()
                    else if(fetched.isNotEmpty() && hasEverHadTasks==false) hasEverHadTasks=true
                }
            }
        }
        // projects listener
        LaunchedEffect(user?.uid){
            val u = user ?: return@LaunchedEffect
            db.collection("projects").whereEqualTo("userId", u.uid).addSnapshotListener{ snap, _ ->
                if(snap!=null){
                    val arr = snap.documents.mapNotNull{ it.toObject(Project::class.java) }.sortedBy{ it.order }
                    projects = arr
                }
            }
        }

        val filteredForSearch = remember(tasks, searchQuery){
            if(searchQuery.isBlank()) tasks.take(30)
            else tasks.filter{ t ->
                val q = searchQuery.lowercase()
                t.title.lowercase().contains(q) || t.priority.lowercase().contains(q) || t.labels.any{ it.lowercase().contains(q)} || (t.categoryName?.lowercase()?.contains(q)?:false) || (t.projectName?.lowercase()?.contains(q)?:false) || (t.scheduledDate?.contains(q)?:false)
            }.take(30)
        }

        Box(Modifier.fillMaxSize().background(brutalBg())){
            BrutalHashOverlay(opacity=0.04f)
            Scaffold(
                containerColor=Color.Transparent,
                bottomBar={ BrutalBottomBar(navController, anims, tasks) },
                floatingActionButton={
                    BrutalFAB(onClick={
                        // navigate to today and focus add
                        navController.navigate("today")
                    })
                }
            ){ padding ->
                NavHost(navController, startDestination="today", Modifier.padding(padding)){
                    composable("today"){
                        TodayDashboard(
                            tasks=tasks, projects=projects, selectedDate=selectedDate,
                            onDateSelected={selectedDate=it},
                            hasEverHadTasks=hasEverHadTasks,
                            onSearchClick={ searchOpen = true },
                            onSeedOnboarding={
                                val u = auth.currentUser ?: return@TodayDashboard
                                val batch = db.batch()
                                val sdf = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
                                val sd = sdf.format(selectedDate)
                                listOf("Organize the everyday chaos","Focus on the right things","Achieve goals and finish projects").forEachIndexed{ idx, title ->
                                    val ref = db.collection("tasks").document()
                                    batch.set(ref, hashMapOf(
                                        "userId" to u.uid,
                                        "title" to title,
                                        "status" to "active",
                                        "scheduledDate" to sd,
                                        "priority" to if(idx==1) "high" else "none",
                                        "labels" to emptyList<String>(),
                                        "attachments" to emptyList<Any>(),
                                        "order" to (System.currentTimeMillis() - idx*1000),
                                        "createdAt" to FieldValue.serverTimestamp(),
                                        "updatedAt" to FieldValue.serverTimestamp()
                                    ))
                                }
                                batch.commit()
                                hasEverHadTasks=true
                            },
                            onMicClick={
                                val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply{
                                    putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
                                }
                                speechRecognizerLauncher.launch(intent)
                            },
                            voiceText=voiceInputResult.value,
                            onVoiceConsumed={ voiceInputResult.value="" },
                            anims=anims
                        )
                    }
                    composable("inbox"){ InboxScreen(tasks, anims) }
                    composable("upcoming"){ UpcomingScreen(tasks, anims) }
                    composable("projects"){ ProjectsScreen(projects, tasks, anims) }
                    composable("settings"){ SettingsScreen(isDark, onToggleDark, accent, onAccentChange) }
                }
            }
            // search overlay — now solid bg, not overlapping float
            if(searchOpen){
                Box(Modifier.fillMaxSize().background(brutalBg())){
                    BrutalHashOverlay(opacity=0.04f)
                    Column(Modifier.fillMaxSize().padding(12.dp)){
                        // header — not overlapping
                        Box(Modifier.fillMaxWidth().shadow(6.dp, shape=BrutalRect).background(brutalSurface()).border(4.dp, BrutalBlack).padding(8.dp)){
                            Row(verticalAlignment=Alignment.CenterVertically){
                                Box(Modifier.size(36.dp).background(BrutalYellow).border(3.dp, BrutalBlack), contentAlignment=Alignment.Center){ Icon(Icons.Default.Search, null, tint=BrutalBlack, modifier=Modifier.size(20.dp)) }
                                Spacer(Modifier.width(8.dp))
                                TextField(value=searchQuery, onValueChange={searchQuery=it}, placeholder={Text("TYPE TITLE, #MANGA, PRIORITY...", fontFamily=JetBrainsMono, fontWeight=FontWeight.Black, fontSize=11.sp, color=BrutalBlack.copy(0.4f))}, modifier=Modifier.weight(1f).background(BrutalWhite).border(3.dp, BrutalBlack), colors=TextFieldDefaults.colors(focusedContainerColor=BrutalWhite, unfocusedContainerColor=BrutalWhite, focusedIndicatorColor=Color.Transparent, unfocusedIndicatorColor=Color.Transparent))
                                Spacer(Modifier.width(8.dp))
                                Box(Modifier.size(36.dp).background(BrutalRed).border(3.dp, BrutalBlack).clickable{ searchOpen=false; searchQuery="" }, contentAlignment=Alignment.Center){ Icon(Icons.Default.Close, null, tint=BrutalWhite, modifier=Modifier.size(18.dp)) }
                            }
                        }
                        Spacer(Modifier.height(8.dp))
                        Box(Modifier.background(BrutalBlack).padding(horizontal=8.dp, vertical=4.dp)){ Text("${filteredForSearch.size} RESULTS // ${tasks.size} TOTAL", fontFamily=JetBrainsMono, fontSize=10.sp, fontWeight=FontWeight.Black, color=BrutalYellow) }
                        Spacer(Modifier.height(8.dp))
                        LazyColumn(verticalArrangement=Arrangement.spacedBy(8.dp), modifier=Modifier.weight(1f)){
                            items(filteredForSearch){ t ->
                                TaskCardRow(t, anims, showDelete=false)
                            }
                        }
                    }
                }
            }
        }
    }

    @Composable fun BrutalBottomBar(navController: androidx.navigation.NavController, anims: BrutalAnimations, tasks: List<Task>){
        Column{
            Row(Modifier.fillMaxWidth().height(6.dp).background(BrutalWhite).border(2.dp, BrutalBlack)){
                Box(Modifier.weight(1f).fillMaxHeight().background(BrutalYellow).border(1.dp, BrutalBlack))
                Box(Modifier.weight(1f).fillMaxHeight().background(BrutalCyan).border(1.dp, BrutalBlack))
                Box(Modifier.weight(1f).fillMaxHeight().background(BrutalPurple).border(1.dp, BrutalBlack))
                Box(Modifier.weight(1f).fillMaxHeight().background(BrutalRed))
            }
            NavigationBar(containerColor=brutalSurface(), modifier=Modifier.shadow(6.dp, shape=BrutalRect).border(4.dp, BrutalBlack)){
                val entry by navController.currentBackStackEntryAsState()
                val route = entry?.destination?.route
                val inboxCount = tasks.count{ it.scheduledDate==null && it.status=="active" }
                val upcomingCount = tasks.count{ it.scheduledDate!=null && it.status=="active" }
                val projCount = remember(tasks){ 0 } // not needed
                val items = listOf(
                    Triple("inbox", Icons.Default.Inbox to "INBOX ($inboxCount)", inboxCount),
                    Triple("today", Icons.Default.Home to "TODAY", -1),
                    Triple("upcoming", Icons.Default.CalendarToday to "UPCOMING ($upcomingCount)", upcomingCount),
                    Triple("projects", Icons.Default.Folder to "PROJECTS", -1),
                    Triple("settings", Icons.Default.Settings to "SETTINGS", -1)
                )
                items.forEach{ (r, labelPair, _) ->
                    val (icon, label) = labelPair as Pair<*, *>
                    val selected = route==r
                    NavigationBarItem(
                        icon={
                            Box(Modifier.size(28.dp).background(if(selected) BrutalYellow else brutalSurface()).border(3.dp, BrutalBlack), contentAlignment=Alignment.Center){
                                Icon(icon as androidx.compose.ui.graphics.vector.ImageVector, label as String, tint=BrutalBlack, modifier=Modifier.size(16.dp))
                            }
                        },
                        label={ Text((label as String).take(7), fontFamily=JetBrainsMono, fontWeight=FontWeight.Black, fontSize=7.sp, color=if(selected) BrutalYellow else brutalOnSurface(), letterSpacing=0.5.sp, maxLines=1, overflow=TextOverflow.Ellipsis) },
                        selected=selected,
                        onClick={ navController.navigate(r){ launchSingleTop=true } },
                        colors=NavigationBarItemDefaults.colors(selectedIconColor=BrutalBlack, unselectedIconColor=BrutalBlack, selectedTextColor=BrutalBlack, unselectedTextColor=BrutalBlack, indicatorColor=BrutalBlack)
                    )
                }
            }
        }
    }

    @Composable fun BrutalFAB(onClick:()->Unit){
        var pressed by remember{ mutableStateOf(false) }
        val offset by animateDpAsState(if(pressed) 6.dp else 0.dp, spring(dampingRatio=0.5f, stiffness=400f), label="fab")
        Box(Modifier.size(64.dp).offset{ IntOffset(offset.roundToPx(), offset.roundToPx()) }.shadow(6.dp, shape=BrutalRect).background(BrutalBlack).border(4.dp, BrutalBlack).pointerInput(Unit){
            detectTapGestures(onPress={ pressed=true; tryAwaitRelease(); pressed=false }, onTap={ onClick() })
        }.padding(2.dp).background(BrutalYellow).border(3.dp, BrutalBlack), contentAlignment=Alignment.Center){
            Icon(Icons.Default.Add, "Add", tint=BrutalBlack, modifier=Modifier.size(32.dp))
        }
    }

    @Composable fun TodayDashboard(
        tasks: List<Task>, projects: List<Project>, selectedDate: Date,
        onDateSelected:(Date)->Unit, hasEverHadTasks: Boolean?,
        onSearchClick:()->Unit,
        onSeedOnboarding:()->Unit, onMicClick:()->Unit,
        voiceText: String, onVoiceConsumed:()->Unit, anims: BrutalAnimations
    ){
        val context = LocalContext.current
        val sdf = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
        val dispFmt = SimpleDateFormat("EEEE — MMM d", Locale.getDefault())
        val selectedStr = sdf.format(selectedDate)
        val active = tasks.filter{ it.scheduledDate==selectedStr && it.status=="active" }
        val completed = tasks.filter{ it.scheduledDate==selectedStr && it.status=="completed" }
        var newTitle by remember{ mutableStateOf("") }
        var priority by remember{ mutableStateOf("none") }
        var dueAt by remember{ mutableStateOf<String?>(null) }
        var reminderAt by remember{ mutableStateOf<String?>(null) }
        var mangaMode by remember{ mutableStateOf(false) }
        var selectedProjectId by remember{ mutableStateOf<String?>(null) }
        var showDuePicker by remember{ mutableStateOf(false) }
        var showReminderPicker by remember{ mutableStateOf(false) }
        var showPriorityPicker by remember{ mutableStateOf(false) }
        var showProjectPicker by remember{ mutableStateOf(false) }
        var showCreateProject by remember{ mutableStateOf(false) }
        var newProjectName by remember{ mutableStateOf("") }
        var newProjectColor by remember{ mutableStateOf("bg-[#FFE600]") }
        var newProjectIcon by remember{ mutableStateOf("◆") }
        var error by remember{ mutableStateOf("") }
        var pendingDelete by remember{ mutableStateOf<Task?>(null) }
        var pendingDeleteAll by remember{ mutableStateOf(false) }

        // consume voice
        LaunchedEffect(voiceText){
            if(voiceText.isNotEmpty()){
                newTitle = if(newTitle.isEmpty()) voiceText else "$newTitle $voiceText"
                onVoiceConsumed()
            }
        }

        val selectedProject = projects.find{ it.id==selectedProjectId }

        // pickers helpers
        fun pickDateTime(onPicked:(String)->Unit, initial: String?){
            val cal = Calendar.getInstance()
            if(initial!=null) try{ SimpleDateFormat("yyyy-MM-dd'T'HH:mm", Locale.getDefault()).parse(initial)?.let{ cal.time = it } }catch(_:Exception){}
            DatePickerDialog(context, { _, y,m,d ->
                TimePickerDialog(context, { _, h, min ->
                    cal.set(y,m,d,h,min)
                    val iso = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.getDefault()).apply{ timeZone=TimeZone.getTimeZone("UTC")}.format(cal.time)
                    // store as local ISO for display but save as ISO
                    onPicked(SimpleDateFormat("yyyy-MM-dd'T'HH:mm", Locale.getDefault()).format(cal.time))
                }, cal.get(Calendar.HOUR_OF_DAY), cal.get(Calendar.MINUTE), true).show()
            }, cal.get(Calendar.YEAR), cal.get(Calendar.MONTH), cal.get(Calendar.DAY_OF_MONTH)).show()
        }

        Box(Modifier.fillMaxSize()){
            BrutalHashOverlay(opacity=0.04f)
            LazyColumn(modifier=Modifier.fillMaxSize().padding(12.dp), verticalArrangement=Arrangement.spacedBy(8.dp)){
                item{
                    // header
                    Box(Modifier.fillMaxWidth().shadow(6.dp, shape=BrutalRect).background(brutalSurface()).border(4.dp, BrutalBlack).padding(12.dp)){
                        Column{
                            Row(verticalAlignment=Alignment.CenterVertically){
                                Box(Modifier.background(BrutalBlack).border(3.dp, BrutalBlack).padding(horizontal=8.dp, vertical=4.dp)){
                                    Text("TODAY", fontFamily=SyneFamily, fontSize=22.sp, fontWeight=FontWeight.Black, color=BrutalYellow, letterSpacing=(-1).sp)
                                }
                                Spacer(Modifier.width(8.dp))
                                Box(Modifier.background(BrutalYellow).border(3.dp, BrutalBlack).padding(horizontal=6.dp, vertical=4.dp)){
                                    Text(dispFmt.format(selectedDate).uppercase(), fontFamily=JetBrainsMono, fontSize=10.sp, fontWeight=FontWeight.Black, color=BrutalBlack, letterSpacing=1.sp)
                                }
                            }
                            Spacer(Modifier.height(6.dp))
                            Row(horizontalArrangement=Arrangement.spacedBy(6.dp)){
                                Box(Modifier.background(BrutalYellow).border(3.dp, BrutalBlack).padding(horizontal=8.dp, vertical=4.dp)){ Text("${active.size} ACTIVE", fontFamily=JetBrainsMono, fontSize=10.sp, fontWeight=FontWeight.Black, color=BrutalBlack) }
                                Box(Modifier.background(BrutalBlack).border(3.dp, BrutalBlack).padding(horizontal=8.dp, vertical=4.dp)){ Text("BRUTAL MODE ON", fontFamily=JetBrainsMono, fontSize=10.sp, fontWeight=FontWeight.Black, color=BrutalYellow) }
                            }
                        }
                    }
                }
                // ── SEARCH CARD — placed AFTER TODAY, not overlapping it (fixes image 1) ──
                item{
                    Box(
                        Modifier.fillMaxWidth()
                            .shadow(6.dp, shape = BrutalRect)
                            .background(BrutalBlack)
                            .border(4.dp, BrutalBlack)
                            .clickable { onSearchClick() }
                            .padding(horizontal = 12.dp, vertical = 12.dp)
                    ){
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.Center, modifier = Modifier.fillMaxWidth()){
                            Box(Modifier.size(28.dp).background(BrutalYellow).border(3.dp, BrutalBlack), contentAlignment = Alignment.Center){
                                Icon(Icons.Default.Search, contentDescription = "Search", tint = BrutalBlack, modifier = Modifier.size(18.dp))
                            }
                            Spacer(Modifier.width(10.dp))
                            Text("SEARCH  //  TAP  TO  FIND  SLAB", fontFamily = JetBrainsMono, fontWeight = FontWeight.Black, fontSize = 12.sp, color = BrutalYellow, letterSpacing = 0.5.sp)
                            Spacer(Modifier.width(10.dp))
                            Box(Modifier.size(22.dp).background(BrutalYellow).border(2.dp, BrutalBlack), contentAlignment = Alignment.Center){
                                Icon(Icons.Default.Search, null, tint = BrutalBlack, modifier = Modifier.size(14.dp))
                            }
                        }
                    }
                }
                item{ BrutalMarquee(anims) }
                item{
                    Box(Modifier.fillMaxWidth().shadow(6.dp, shape=BrutalRect).background(brutalSurface()).border(4.dp, BrutalBlack).padding(8.dp)){
                        Column{
                            Row(verticalAlignment=Alignment.CenterVertically){
                                Box(Modifier.background(BrutalBlack).padding(horizontal=6.dp, vertical=2.dp)){ Text("WEEK SELECTOR // PICK YOUR BATTLE", fontFamily=JetBrainsMono, fontSize=8.sp, fontWeight=FontWeight.Black, color=BrutalYellow, letterSpacing=1.sp) }
                                Spacer(Modifier.weight(1f))
                                Box(Modifier.background(BrutalYellow).border(2.dp, BrutalBlack).padding(horizontal=4.dp, vertical=2.dp)){ Text("7 DAYS", fontFamily=JetBrainsMono, fontSize=8.sp, fontWeight=FontWeight.Black, color=BrutalBlack) }
                            }
                            Spacer(Modifier.height(8.dp))
                            WeeklyDateSelector(selectedDate, onDateSelected)
                        }
                    }
                }
                item{
                    // add task bar
                    Box(Modifier.fillMaxWidth().shadow(6.dp, shape=BrutalRect).background(brutalSurface()).border(4.dp, BrutalBlack).padding(8.dp)){
                        Column{
                            Row(Modifier.fillMaxWidth(), verticalAlignment=Alignment.CenterVertically){
                                Box(Modifier.size(40.dp).background(BrutalBlack).border(3.dp, BrutalBlack), contentAlignment=Alignment.Center){ Icon(Icons.Default.Add, null, tint=BrutalYellow, modifier=Modifier.size(22.dp)) }
                                Spacer(Modifier.width(8.dp))
                                Box(Modifier.weight(1f).background(BrutalYellow.copy(0.3f)).border(3.dp, BrutalBlack).padding(horizontal=10.dp, vertical=10.dp)){
                                    // using TextField invisible
                                    // For simplicity use Text + clickable to open dialog? Use actual TextField
                                }
                            }
                            // real input row
                            Row(Modifier.fillMaxWidth(), verticalAlignment=Alignment.CenterVertically){
                                // we need a real input: use TextField
                            }
                            // Replace with actual Input
                            var textFieldValue = newTitle
                            Row(Modifier.fillMaxWidth(), verticalAlignment=Alignment.CenterVertically){
                                Box(Modifier.size(40.dp).background(BrutalBlack).border(3.dp, BrutalBlack), contentAlignment=Alignment.Center){ Icon(Icons.Default.Add, null, tint=BrutalYellow, modifier=Modifier.size(20.dp)) }
                                Spacer(Modifier.width(8.dp))
                                TextField(value=newTitle, onValueChange={newTitle=it; error=""}, placeholder={Text("ADD A TASK... MAKE IT LOUD!", fontFamily=JetBrainsMono, fontWeight=FontWeight.Black, fontSize=11.sp, color=BrutalBlack.copy(0.4f))}, modifier=Modifier.weight(1f).border(3.dp, BrutalBlack).background(Color.White), colors=TextFieldDefaults.colors(focusedContainerColor=BrutalWhite, unfocusedContainerColor=BrutalYellow.copy(0.2f), focusedIndicatorColor=Color.Transparent, unfocusedIndicatorColor=Color.Transparent))
                                Spacer(Modifier.width(8.dp))
                                var micPressed by remember{ mutableStateOf(false) }
                                val micOff by animateDpAsState(if(micPressed) 3.dp else 0.dp, spring(dampingRatio=0.5f, stiffness=500f), label="mic")
                                Box(Modifier.size(44.dp).offset{ IntOffset(micOff.roundToPx(), micOff.roundToPx()) }.shadow(4.dp, shape=BrutalRect).background(brutalSurface()).border(4.dp, BrutalBlack).pointerInput(Unit){
                                    detectTapGestures(onPress={ micPressed=true; tryAwaitRelease(); micPressed=false }, onTap={ onMicClick() })
                                }, contentAlignment=Alignment.Center){ Icon(Icons.Default.Mic, "Voice", tint=BrutalBlack, modifier=Modifier.size(20.dp)) }
                            }
                            Spacer(Modifier.height(8.dp))
                            // functional pills scroll
                            LazyRow(horizontalArrangement=Arrangement.spacedBy(6.dp)){
                                item{
                                    Box(Modifier.background(BrutalPurple).border(3.dp, BrutalBlack).padding(horizontal=8.dp, vertical=6.dp)){
                                        Text(SimpleDateFormat("EEE", Locale.getDefault()).format(selectedDate).uppercase(), fontFamily=JetBrainsMono, fontSize=10.sp, fontWeight=FontWeight.Black, color=BrutalBlack)
                                    }
                                }
                                item{
                                    Box(Modifier.background(if(dueAt!=null) BrutalYellow else BrutalWhite).border(3.dp, BrutalBlack).padding(horizontal=8.dp, vertical=6.dp).clickable{ showDuePicker=true }){
                                        Text(if(dueAt!=null) dueAt!!.take(16) else "DEADLINE", fontFamily=JetBrainsMono, fontSize=10.sp, fontWeight=FontWeight.Black, color=BrutalBlack)
                                    }
                                }
                                item{
                                    val c = prioColor(priority)
                                    val txt = if(priority=="none") "P1" else priority.uppercase()
                                    Box(Modifier.background(if(priority=="none") BrutalRed else c).border(3.dp, BrutalBlack).padding(horizontal=8.dp, vertical=6.dp).clickable{ showPriorityPicker=true }){
                                        Text(txt, fontFamily=JetBrainsMono, fontSize=10.sp, fontWeight=FontWeight.Black, color=if(priority=="urgent") BrutalWhite else BrutalBlack)
                                    }
                                }
                                item{
                                    Box(Modifier.background(if(reminderAt!=null) BrutalCyan else BrutalCyan).border(3.dp, BrutalBlack).padding(horizontal=8.dp, vertical=6.dp).clickable{ showReminderPicker=true }){
                                        Text(if(reminderAt!=null) reminderAt!!.take(16) else "REMINDER", fontFamily=JetBrainsMono, fontSize=10.sp, fontWeight=FontWeight.Black, color=BrutalBlack)
                                    }
                                }
                                item{
                                    Box(Modifier.background(if(mangaMode) BrutalBlack else BrutalYellow).border(3.dp, BrutalBlack).padding(horizontal=8.dp, vertical=6.dp).clickable{ mangaMode=!mangaMode }){
                                        Text("MANGA", fontFamily=JetBrainsMono, fontSize=10.sp, fontWeight=FontWeight.Black, color=if(mangaMode) BrutalYellow else BrutalBlack)
                                    }
                                }
                                item{
                                    Box(Modifier.background(if(selectedProjectId!=null) BrutalBlack else BrutalWhite).border(3.dp, BrutalBlack).padding(horizontal=8.dp, vertical=6.dp).clickable{ showProjectPicker=true }){
                                        Text((selectedProject?.name ?: "PROJECT").take(12).uppercase(), fontFamily=JetBrainsMono, fontSize=10.sp, fontWeight=FontWeight.Black, color=if(selectedProjectId!=null) BrutalYellow else BrutalBlack)
                                    }
                                }
                            }
                            if(selectedProjectId!=null){
                                Spacer(Modifier.height(6.dp))
                                Box(Modifier.fillMaxWidth().background(BrutalBlack).border(3.dp, BrutalBlack).padding(8.dp)){
                                    Text("SLAMMING INTO: ${selectedProject?.name}", fontFamily=JetBrainsMono, fontSize=10.sp, fontWeight=FontWeight.Black, color=BrutalYellow)
                                }
                            }
                            if(error.isNotEmpty()){
                                Spacer(Modifier.height(6.dp))
                                Box(Modifier.fillMaxWidth().background(BrutalRed).border(3.dp, BrutalBlack).padding(8.dp)){ Text("⚠ $error", color=BrutalWhite, fontFamily=JetBrainsMono, fontSize=11.sp, fontWeight=FontWeight.Black) }
                            }
                            Spacer(Modifier.height(8.dp))
                            Box(Modifier.fillMaxWidth().height(44.dp).background(BrutalBlack).border(4.dp, BrutalBlack).clickable{
                                val title = newTitle.trim()
                                if(title.isEmpty()){ error="TYPE A TASK FIRST!"; return@clickable }
                                val u = auth.currentUser ?: return@clickable
                                val payload = hashMapOf<String, Any?>(
                                    "userId" to u.uid,
                                    "title" to title,
                                    "status" to "active",
                                    "scheduledDate" to sdf.format(selectedDate),
                                    "priority" to priority,
                                    "labels" to if(mangaMode) listOf("manga") else emptyList<String>(),
                                    "attachments" to emptyList<Any>(),
                                    "order" to System.currentTimeMillis(),
                                    "createdAt" to FieldValue.serverTimestamp(),
                                    "updatedAt" to FieldValue.serverTimestamp()
                                )
                                selectedProject?.let{ payload["projectId"]=it.id; payload["projectName"]=it.name; payload["categoryId"]=it.id; payload["categoryName"]=it.name }
                                if(dueAt!=null) try{ payload["dueAt"]= SimpleDateFormat("yyyy-MM-dd'T'HH:mm", Locale.getDefault()).parse(dueAt!!)?.let{ SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.getDefault()).apply{ timeZone=TimeZone.getTimeZone("UTC")}.format(it) } }catch(_:Exception){}
                                if(reminderAt!=null) try{ payload["reminderAt"]= SimpleDateFormat("yyyy-MM-dd'T'HH:mm", Locale.getDefault()).parse(reminderAt!!)?.let{ SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.getDefault()).apply{ timeZone=TimeZone.getTimeZone("UTC")}.format(it) } }catch(_:Exception){}
                                db.collection("tasks").add(payload).addOnSuccessListener{
                                    newTitle=""; error=""
                                }.addOnFailureListener{ e -> error=e.message ?: "SAVE FAILED" }
                            }, contentAlignment=Alignment.Center){
                                Text("ADD — SLAM!", fontFamily=JetBrainsMono, fontWeight=FontWeight.Black, color=BrutalYellow, letterSpacing=1.sp)
                            }
                            // priority picker dialog
                            if(showPriorityPicker){
                                AlertDialog(onDismissRequest={showPriorityPicker=false}, title={Text("PICK PRIORITY", fontFamily=JetBrainsMono, fontWeight=FontWeight.Black)}, text={
                                    Column(verticalArrangement=Arrangement.spacedBy(6.dp)){
                                        listOf("none","low","medium","high","urgent").forEach{ p ->
                                            Box(Modifier.fillMaxWidth().background(if(priority==p) BrutalBlack else BrutalWhite).border(3.dp, BrutalBlack).clickable{ priority=p; showPriorityPicker=false }.padding(12.dp)){
                                                Text(p.uppercase(), fontFamily=JetBrainsMono, fontWeight=FontWeight.Black, color=if(priority==p) BrutalYellow else BrutalBlack)
                                            }
                                        }
                                    }
                                }, confirmButton={}, containerColor=BrutalWhite, shape=BrutalRect)
                            }
                            if(showProjectPicker){
                                AlertDialog(onDismissRequest={showProjectPicker=false}, title={Text("PICK PROJECT", fontFamily=JetBrainsMono, fontWeight=FontWeight.Black)}, text={
                                    Column(verticalArrangement=Arrangement.spacedBy(6.dp)){
                                        Box(Modifier.fillMaxWidth().background(if(selectedProjectId==null) BrutalBlack else BrutalWhite).border(3.dp, BrutalBlack).clickable{ selectedProjectId=null; showProjectPicker=false }.padding(12.dp)){
                                            Text("NO PROJECT", fontFamily=JetBrainsMono, fontWeight=FontWeight.Black, color=if(selectedProjectId==null) BrutalYellow else BrutalBlack)
                                        }
                                        projects.forEach{ p ->
                                            Box(Modifier.fillMaxWidth().background(if(selectedProjectId==p.id) BrutalBlack else BrutalWhite).border(3.dp, BrutalBlack).clickable{ selectedProjectId=p.id; showProjectPicker=false }.padding(12.dp)){
                                                Text(p.name, fontFamily=JetBrainsMono, fontWeight=FontWeight.Black, color=if(selectedProjectId==p.id) BrutalYellow else BrutalBlack)
                                            }
                                        }
                                        Box(Modifier.fillMaxWidth().background(BrutalYellow).border(3.dp, BrutalBlack).clickable{ showProjectPicker=false; showCreateProject=true }.padding(12.dp), contentAlignment=Alignment.Center){
                                            Text("+ NEW PROJECT", fontFamily=JetBrainsMono, fontWeight=FontWeight.Black, color=BrutalBlack)
                                        }
                                    }
                                }, confirmButton={}, containerColor=BrutalWhite, shape=BrutalRect)
                            }
                            if(showDuePicker){
                                LaunchedEffect(Unit){ pickDateTime({ dueAt=it; showDuePicker=false }, dueAt); showDuePicker=false }
                            }
                            if(showReminderPicker){
                                LaunchedEffect(Unit){ pickDateTime({ reminderAt=it; showReminderPicker=false }, reminderAt); showReminderPicker=false }
                            }
                            if(showCreateProject){
                                AlertDialog(onDismissRequest={showCreateProject=false}, title={Text("NEW SLAB", fontFamily=SyneFamily, fontWeight=FontWeight.Black)}, text={
                                    Column(verticalArrangement=Arrangement.spacedBy(8.dp)){
                                        TextField(value=newProjectName, onValueChange={newProjectName=it}, placeholder={Text("E.G. PERSONAL...")}, modifier=Modifier.fillMaxWidth().border(3.dp, BrutalBlack), colors=TextFieldDefaults.colors(focusedContainerColor=BrutalWhite, unfocusedContainerColor=BrutalWhite, focusedIndicatorColor=Color.Transparent, unfocusedIndicatorColor=Color.Transparent))
                                        Row(horizontalArrangement=Arrangement.spacedBy(6.dp), modifier=Modifier.fillMaxWidth()){
                                            listOf("bg-[#FFE600]" to BrutalYellow, "bg-[#22D3EE]" to BrutalCyan, "bg-[#A78BFA]" to BrutalPurple, "bg-[#FF3B30]" to BrutalRed).forEach{ (str,col) ->
                                                Box(Modifier.weight(1f).height(36.dp).background(col).border(3.dp, BrutalBlack).clickable{ newProjectColor=str }.padding(4.dp), contentAlignment=Alignment.Center){
                                                    if(newProjectColor==str) Text("✓", fontWeight=FontWeight.Black, color=BrutalBlack)
                                                }
                                            }
                                        }
                                        Row(horizontalArrangement=Arrangement.spacedBy(6.dp)){
                                            listOf("◆","▓","★","●","▲","■").forEach{ ic ->
                                                Box(Modifier.size(36.dp).background(if(newProjectIcon==ic) BrutalBlack else BrutalWhite).border(3.dp, BrutalBlack).clickable{ newProjectIcon=ic }, contentAlignment=Alignment.Center){
                                                    Text(ic, fontWeight=FontWeight.Black, color=if(newProjectIcon==ic) BrutalYellow else BrutalBlack)
                                                }
                                            }
                                        }
                                        Box(Modifier.fillMaxWidth().height(44.dp).background(BrutalBlack).border(3.dp, BrutalBlack).clickable{
                                            val name = newProjectName.trim()
                                            if(name.isEmpty()) return@clickable
                                            if(projects.any{ it.name.equals(name, true)}){ Toast.makeText(context,"SLAB EXISTS", Toast.LENGTH_SHORT).show(); return@clickable }
                                            val u = auth.currentUser ?: return@clickable
                                            db.collection("projects").add(hashMapOf("userId" to u.uid, "name" to name.uppercase(), "color" to newProjectColor, "icon" to newProjectIcon, "order" to System.currentTimeMillis(), "createdAt" to FieldValue.serverTimestamp(), "updatedAt" to FieldValue.serverTimestamp())).addOnSuccessListener{ doc ->
                                                selectedProjectId=doc.id; newProjectName=""; showCreateProject=false
                                            }
                                        }, contentAlignment=Alignment.Center){ Text("CREATE ✦ SLAM!", fontFamily=JetBrainsMono, fontWeight=FontWeight.Black, color=BrutalYellow) }
                                    }
                                }, confirmButton={}, containerColor=BrutalWhite, shape=BrutalRect)
                            }
                        }
                    }
                }
                // tasks handling
                if(hasEverHadTasks==false){
                    item{
                        Box(Modifier.fillMaxWidth().shadow(8.dp, shape=BrutalRect).background(BrutalWhite).border(4.dp, BrutalBlack).padding(16.dp)){
                            Column{
                                Box(Modifier.background(BrutalRed).border(3.dp, BrutalBlack).padding(horizontal=8.dp, vertical=4.dp)){ Text("WELCOME TO VASTAVIK TODO!", fontFamily=JetBrainsMono, fontWeight=FontWeight.Black, color=BrutalWhite, fontSize=12.sp) }
                                Spacer(Modifier.height(8.dp))
                                Box(Modifier.fillMaxWidth().background(BrutalYellow).border(4.dp, BrutalBlack).padding(12.dp)){
                                    Column(verticalArrangement=Arrangement.spacedBy(6.dp)){
                                        listOf("Organize the everyday chaos","Focus on the right things","Achieve goals and finish projects").forEach{ txt ->
                                            Row(Modifier.fillMaxWidth().background(BrutalWhite).border(3.dp, BrutalBlack).padding(8.dp), verticalAlignment=Alignment.CenterVertically){
                                                Box(Modifier.size(24.dp).background(BrutalGreen).border(2.dp, BrutalBlack), contentAlignment=Alignment.Center){ Icon(Icons.Default.Check, null, tint=BrutalWhite, modifier=Modifier.size(14.dp)) }
                                                Spacer(Modifier.width(8.dp))
                                                Text(txt.uppercase(), fontFamily=JetBrainsMono, fontWeight=FontWeight.Black, fontSize=11.sp)
                                            }
                                        }
                                        Box(Modifier.fillMaxWidth().height(44.dp).background(BrutalRed).border(4.dp, BrutalBlack).clickable{ onSeedOnboarding() }, contentAlignment=Alignment.Center){
                                            Text("LET'S GO — SLAM IT! →", fontFamily=JetBrainsMono, fontWeight=FontWeight.Black, color=BrutalWhite)
                                        }
                                    }
                                }
                            }
                        }
                    }
                } else if(active.isEmpty() && completed.isEmpty()){
                    item{
                        Box(Modifier.fillMaxWidth().shadow(6.dp, shape=BrutalRect).background(brutalSurface()).border(4.dp, BrutalBlack).padding(24.dp), contentAlignment=Alignment.Center){
                            Column(horizontalAlignment=Alignment.CenterHorizontally){
                                Box(Modifier.size(64.dp).offset{ IntOffset(0, anims.floatY.dp.roundToPx()) }.background(BrutalYellow).border(4.dp, BrutalBlack).rotate(anims.jitter), contentAlignment=Alignment.Center){ Icon(Icons.Default.Check, null, tint=BrutalBlack, modifier=Modifier.size(32.dp)) }
                                Spacer(Modifier.height(12.dp))
                                Text("ALL CAUGHT UP!", fontFamily=SyneFamily, color=brutalOnSurface(), fontWeight=FontWeight.Black, fontSize=18.sp)
                                Text("NO TASKS — GO MAKE NOISE", fontFamily=JetBrainsMono, color=brutalOnSurface().copy(0.5f), fontWeight=FontWeight.Black, fontSize=10.sp, letterSpacing=1.sp)
                            }
                        }
                    }
                } else {
                    item{
                        Row(verticalAlignment=Alignment.CenterVertically, modifier=Modifier.padding(vertical=4.dp)){
                            Box(Modifier.background(BrutalBlack).padding(horizontal=8.dp, vertical=4.dp)){ Text("ACTIVE — ${active.size}", fontFamily=JetBrainsMono, fontSize=10.sp, fontWeight=FontWeight.Black, color=BrutalYellow) }
                            Spacer(Modifier.width(6.dp))
                            Box(Modifier.weight(1f).height(4.dp).background(BrutalBlack))
                            if(active.size+completed.size>0){
                                Box(Modifier.background(BrutalRed).border(2.dp, BrutalBlack).padding(horizontal=8.dp, vertical=4.dp).clickable{ pendingDeleteAll=true }){
                                    Text("DELETE ALL", fontFamily=JetBrainsMono, fontSize=9.sp, fontWeight=FontWeight.Black, color=BrutalWhite)
                                }
                            }
                        }
                    }
                    items(active, key={it.id}){ task ->
                        TaskCardRow(task, anims, onDelete={ pendingDelete=it })
                    }
                    if(completed.isNotEmpty()){
                        item{
                            Spacer(Modifier.height(8.dp))
                            Row(verticalAlignment=Alignment.CenterVertically){
                                Box(Modifier.background(BrutalGreen).border(3.dp, BrutalBlack).padding(horizontal=8.dp, vertical=4.dp)){ Text("COMPLETED — ${completed.size}", fontFamily=JetBrainsMono, fontSize=10.sp, fontWeight=FontWeight.Black, color=BrutalBlack) }
                                Spacer(Modifier.width(6.dp))
                                Box(Modifier.weight(1f).height(3.dp).background(BrutalBlack.copy(0.4f)))
                            }
                        }
                        items(completed, key={it.id}){ task ->
                            TaskCardRow(task, anims, onDelete={ pendingDelete=it })
                        }
                    }
                }
            }
            // delete modals
            pendingDelete?.let{ t ->
                AlertDialog(onDismissRequest={pendingDelete=null}, title={Text("DELETE THIS SLAB?", fontFamily=SyneFamily, fontWeight=FontWeight.Black)}, text={
                    Column{
                        Box(Modifier.fillMaxWidth().background(BrutalYellow).border(3.dp, BrutalBlack).padding(8.dp)){ Text("\"${t.title}\"", fontFamily=JetBrainsMono, fontWeight=FontWeight.Black, fontSize=12.sp) }
                        Spacer(Modifier.height(4.dp))
                        Text("THIS WILL VAPORIZE THE TASK FROM FIRESTORE. NO UNDO.", fontFamily=JetBrainsMono, fontSize=10.sp, fontWeight=FontWeight.Black, color=BrutalBlack.copy(0.6f))
                    }
                }, confirmButton={
                    TextButton(onClick={ db.collection("tasks").document(t.id).delete(); pendingDelete=null }, modifier=Modifier.background(BrutalRed).border(3.dp, BrutalBlack)){ Text("DELETE ✕", color=BrutalWhite, fontWeight=FontWeight.Black) }
                }, dismissButton={
                    TextButton(onClick={pendingDelete=null}, modifier=Modifier.background(BrutalWhite).border(3.dp, BrutalBlack)){ Text("CANCEL", fontWeight=FontWeight.Black, color=BrutalBlack) }
                }, containerColor=BrutalWhite, shape=BrutalRect)
            }
            if(pendingDeleteAll){
                AlertDialog(onDismissRequest={pendingDeleteAll=false}, title={Text("NUKE ALL ${active.size+completed.size} SLABS?", fontFamily=SyneFamily, fontWeight=FontWeight.Black, color=BrutalRed)}, text={ Text("FOR ${dispFmt.format(selectedDate).uppercase()} — THIS WIPES FIRESTORE. NO UNDO.", fontFamily=JetBrainsMono, fontWeight=FontWeight.Black, fontSize=11.sp) }, confirmButton={
                    TextButton(onClick={
                        val batch = db.batch()
                        (active+completed).forEach{ batch.delete(db.collection("tasks").document(it.id)) }
                        batch.commit(); pendingDeleteAll=false
                    }, modifier=Modifier.background(BrutalBlack).border(3.dp, BrutalBlack)){ Text("DELETE ALL ✕", color=BrutalYellow, fontWeight=FontWeight.Black) }
                }, dismissButton={ TextButton(onClick={pendingDeleteAll=false}){ Text("CANCEL", fontWeight=FontWeight.Black)} }, containerColor=BrutalRed, shape=BrutalRect)
            }
        }
    }

    @Composable fun BrutalMarquee(anims: BrutalAnimations){
        Box(Modifier.fillMaxWidth().height(32.dp).clip(BrutalRect).background(BrutalBlack).border(3.dp, BrutalBlack), contentAlignment=Alignment.CenterStart){
            Row(Modifier.offset{ IntOffset(anims.marqueeX.dp.roundToPx(),0)}){
                Text("◆ TODAY IS YOURS — MAKE IT BRUTAL — NO SOFT TASKS — ".repeat(6), fontFamily=JetBrainsMono, fontSize=10.sp, fontWeight=FontWeight.Black, color=BrutalYellow, letterSpacing=1.sp, maxLines=1)
            }
        }
    }

    @Composable fun WeeklyDateSelector(selectedDate: Date, onDateSelected:(Date)->Unit){
        val cal = Calendar.getInstance().apply{ time=selectedDate; set(Calendar.DAY_OF_WEEK, firstDayOfWeek) }
        val dates = mutableListOf<Date>().apply{ repeat(7){ add(cal.time); cal.add(Calendar.DAY_OF_MONTH,1) } }
        val colors = listOf(BrutalWhite, BrutalYellow, BrutalCyan, BrutalPurple, BrutalRed, BrutalWhite, BrutalYellow)
        LazyRow(horizontalArrangement=Arrangement.spacedBy(6.dp)){
            items(dates){ date ->
                val selected = isSameDay(date, selectedDate)
                val idx = dates.indexOf(date)
                val bg = if(selected) BrutalBlack else colors[idx % colors.size]
                val txt = if(selected) BrutalYellow else BrutalBlack
                var pressed by remember{ mutableStateOf(false) }
                val off by animateDpAsState(if(pressed) 3.dp else 0.dp, spring(dampingRatio=0.5f, stiffness=500f), label="day")
                Column(Modifier.width(56.dp).height(68.dp).offset{ IntOffset(off.roundToPx(), off.roundToPx()) }.shadow(4.dp, shape=BrutalRect).background(bg).border(4.dp, BrutalBlack).pointerInput(Unit){
                    detectTapGestures(onPress={ pressed=true; tryAwaitRelease(); pressed=false }, onTap={ onDateSelected(date) })
                }.rotate(if(selected) -1.2f else if(idx%2==0) 0.6f else -0.6f), horizontalAlignment=Alignment.CenterHorizontally, verticalArrangement=Arrangement.Center){
                    Text(SimpleDateFormat("EEE", Locale.getDefault()).format(date).uppercase(), fontFamily=JetBrainsMono, fontSize=9.sp, fontWeight=FontWeight.Black, color=txt.copy(alpha=if(selected)0.8f else 0.6f), letterSpacing=1.sp)
                    Text(SimpleDateFormat("d", Locale.getDefault()).format(date), fontFamily=SyneFamily, fontSize=20.sp, fontWeight=FontWeight.Black, color=txt)
                    if(selected){ Spacer(Modifier.height(2.dp)); Box(Modifier.width(16.dp).height(3.dp).background(BrutalYellow)) }
                }
            }
        }
    }

    @Composable fun TaskCardRow(task: Task, anims: BrutalAnimations, onDelete:((Task)->Unit)?=null, showDelete:Boolean=true){
        val rot = ((task.order % 3) -1)*0.4f
        var pressed by remember{ mutableStateOf(false) }
        val off by animateDpAsState(if(pressed) 4.dp else 0.dp, spring(dampingRatio=0.5f, stiffness=400f), label="card")
        val completed = task.status=="completed"
        Box(Modifier.fillMaxWidth().offset{ IntOffset(off.roundToPx(), off.roundToPx()) }.rotate(if(completed) 0f else rot).shadow(6.dp, shape=BrutalRect).background(if(completed) BrutalWhite.copy(0.7f) else brutalSurface()).border(4.dp, BrutalBlack).pointerInput(Unit){
            detectTapGestures(onPress={ pressed=true; tryAwaitRelease(); pressed=false })
        }){
            Column{
                if(!completed) Row(Modifier.fillMaxWidth().height(6.dp)){
                    Box(Modifier.weight(1f).fillMaxHeight().background(BrutalYellow).border(1.dp, BrutalBlack))
                    Box(Modifier.weight(1f).fillMaxHeight().background(BrutalCyan).border(1.dp, BrutalBlack))
                    Box(Modifier.weight(1f).fillMaxHeight().background(BrutalPurple))
                }
                Row(Modifier.fillMaxWidth().padding(12.dp), verticalAlignment=Alignment.Top){
                    Box(Modifier.size(36.dp).background(brutalSurface()).border(3.dp, BrutalBlack).clickable{
                        val ref = db.collection("tasks").document(task.id)
                        val newStatus = if(task.status=="completed") "active" else "completed"
                        ref.update(mapOf("status" to newStatus, "updatedAt" to FieldValue.serverTimestamp(), "completedAt" to if(newStatus=="completed") FieldValue.serverTimestamp() else null))
                    }, contentAlignment=Alignment.Center){
                        if(completed){ Box(Modifier.fillMaxSize().background(BrutalYellow), contentAlignment=Alignment.Center){ Icon(Icons.Default.Check, null, tint=BrutalBlack, modifier=Modifier.size(20.dp)) } }
                        else Text("✓", fontSize=16.sp, fontWeight=FontWeight.Black, color=BrutalBlack)
                    }
                    Spacer(Modifier.width(12.dp))
                    Column(Modifier.weight(1f)){
                        Text(task.title.uppercase(), fontFamily=SpaceGrotesk, color=if(completed) BrutalBlack.copy(0.5f) else brutalOnSurface(), fontSize=15.sp, fontWeight=FontWeight.Black, letterSpacing=(-0.5).sp, lineHeight=16.sp)
                        Spacer(Modifier.height(6.dp))
                        Row(horizontalArrangement=Arrangement.spacedBy(6.dp), verticalAlignment=Alignment.CenterVertically){
                            val projName = task.projectName ?: task.categoryName
                            if(projName!=null){
                                Box(Modifier.background(BrutalBlack).border(2.dp, BrutalBlack).padding(horizontal=6.dp, vertical=2.dp)){ Text(projName.uppercase(), fontFamily=JetBrainsMono, color=BrutalYellow, fontSize=9.sp, fontWeight=FontWeight.Black, letterSpacing=0.5.sp) }
                            }
                            if(task.priority!="none"){
                                Box(Modifier.background(prioColor(task.priority)).border(3.dp, BrutalBlack).padding(horizontal=6.dp, vertical=2.dp)){
                                    Text(task.priority.uppercase(), fontFamily=JetBrainsMono, fontSize=9.sp, fontWeight=FontWeight.Black, color=if(task.priority=="urgent") BrutalWhite else BrutalBlack)
                                }
                            }
                            task.dueAt?.let{
                                Box(Modifier.background(BrutalYellow).border(2.dp, BrutalBlack).padding(horizontal=4.dp, vertical=2.dp)){
                                    Text(try{ SimpleDateFormat("MMM d h:mm a", Locale.getDefault()).format(SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.getDefault()).apply{ timeZone=TimeZone.getTimeZone("UTC")}.parse(it)!!) }catch(_:Exception){ it.take(16) }, fontFamily=JetBrainsMono, fontSize=8.sp, fontWeight=FontWeight.Black)
                                }
                            }
                        }
                        if(task.labels.isNotEmpty()){
                            Spacer(Modifier.height(4.dp))
                            Row(horizontalArrangement=Arrangement.spacedBy(4.dp)){
                                task.labels.forEach{ lb -> Box(Modifier.background(BrutalPurple).border(2.dp, BrutalBlack).padding(horizontal=4.dp, vertical=2.dp)){ Text("#${lb.uppercase()}", fontFamily=JetBrainsMono, fontSize=9.sp, fontWeight=FontWeight.Black, color=BrutalBlack) } }
                            }
                        }
                    }
                    if(showDelete && onDelete!=null){
                        Box(Modifier.size(32.dp).shadow(3.dp, shape=BrutalRect).background(brutalSurface()).border(3.dp, BrutalBlack).clickable{ onDelete(task) }, contentAlignment=Alignment.Center){
                            Icon(Icons.Default.Delete, null, tint=BrutalRed, modifier=Modifier.size(16.dp))
                        }
                    }
                }
            }
        }
    }

    @Composable fun InboxScreen(tasks: List<Task>, anims: BrutalAnimations){
        var pendingDelete by remember{ mutableStateOf<Task?>(null) }
        var pendingAll by remember{ mutableStateOf(false) }
        val inboxTasks = tasks.filter{ it.scheduledDate==null && it.status=="active" }
        Box(Modifier.fillMaxSize()){
            BrutalHashOverlay(opacity=0.04f)
            LazyColumn(Modifier.fillMaxSize().padding(12.dp), verticalArrangement=Arrangement.spacedBy(10.dp)){
                item{
                    Box(Modifier.fillMaxWidth().shadow(6.dp, shape=BrutalRect).background(BrutalWhite).border(4.dp, BrutalBlack).padding(12.dp)){
                        Row(verticalAlignment=Alignment.CenterVertically){
                            Box(Modifier.size(48.dp).background(BrutalPurple).border(4.dp, BrutalBlack).rotate(-2f), contentAlignment=Alignment.Center){ Icon(Icons.Default.Inbox, null, tint=BrutalBlack, modifier=Modifier.size(24.dp)) }
                            Spacer(Modifier.width(12.dp))
                            Column{
                                Text("INBOX", fontFamily=SyneFamily, fontWeight=FontWeight.Black, fontSize=24.sp, letterSpacing=(-1).sp)
                                Box(Modifier.background(BrutalBlack).padding(horizontal=6.dp, vertical=2.dp)){ Text("${inboxTasks.size} UNSORTED", fontFamily=JetBrainsMono, fontSize=10.sp, fontWeight=FontWeight.Black, color=BrutalYellow) }
                            }
                        }
                    }
                }
                item{ Box(Modifier.fillMaxWidth().height(28.dp).background(BrutalBlack).border(3.dp, BrutalBlack), contentAlignment=Alignment.Center){
                    Text("◆ INBOX — ZERO FRICTION — DUMP IT HERE — SORT IT LATER —", fontFamily=JetBrainsMono, fontSize=10.sp, fontWeight=FontWeight.Black, color=BrutalYellow, maxLines=1)
                }}
                if(inboxTasks.isNotEmpty()){
                    item{ Box(Modifier.fillMaxWidth(), contentAlignment=Alignment.CenterEnd){
                        Box(Modifier.background(BrutalRed).border(3.dp, BrutalBlack).padding(horizontal=8.dp, vertical=4.dp).clickable{ pendingAll=true }){ Text("DELETE ALL ✕", fontFamily=JetBrainsMono, fontSize=10.sp, fontWeight=FontWeight.Black, color=BrutalWhite) }
                    }}
                }
                if(inboxTasks.isEmpty()){
                    item{
                        Box(Modifier.fillMaxWidth().shadow(6.dp, shape=BrutalRect).background(BrutalWhite).border(4.dp, BrutalBlack).padding(24.dp), contentAlignment=Alignment.Center){
                            Column(horizontalAlignment=Alignment.CenterHorizontally){
                                Box(Modifier.size(64.dp).background(BrutalPurple).border(4.dp, BrutalBlack), contentAlignment=Alignment.Center){ Icon(Icons.Default.Inbox, null, tint=BrutalBlack, modifier=Modifier.size(28.dp)) }
                                Spacer(Modifier.height(8.dp))
                                Text("INBOX EMPTY", fontFamily=SyneFamily, fontWeight=FontWeight.Black, fontSize=18.sp)
                                Text("NO UNSCHEDULED CHAOS — YOU'RE CLEAN", fontFamily=JetBrainsMono, fontSize=10.sp, fontWeight=FontWeight.Black, color=BrutalBlack.copy(0.5f))
                            }
                        }
                    }
                } else {
                    items(inboxTasks, key={it.id}){ t -> TaskCardRow(t, anims, onDelete={pendingDelete=it}) }
                }
            }
            pendingDelete?.let{ t ->
                AlertDialog(onDismissRequest={pendingDelete=null}, title={Text("DELETE THIS SLAB?", fontFamily=SyneFamily, fontWeight=FontWeight.Black)}, text={ Box(Modifier.fillMaxWidth().background(BrutalYellow).border(3.dp, BrutalBlack).padding(8.dp)){ Text("\"${t.title}\"", fontFamily=JetBrainsMono, fontWeight=FontWeight.Black)} }, confirmButton={ TextButton(onClick={ db.collection("tasks").document(t.id).delete(); pendingDelete=null }, modifier=Modifier.background(BrutalRed).border(3.dp, BrutalBlack)){ Text("DELETE ✕", color=BrutalWhite, fontWeight=FontWeight.Black)} }, dismissButton={ TextButton(onClick={pendingDelete=null}){ Text("CANCEL", fontWeight=FontWeight.Black)} }, containerColor=BrutalWhite, shape=BrutalRect)
            }
            if(pendingAll){
                AlertDialog(onDismissRequest={pendingAll=false}, title={Text("NUKE ALL ${inboxTasks.size}?", fontFamily=SyneFamily, fontWeight=FontWeight.Black)}, confirmButton={ TextButton(onClick={ val b=db.batch(); inboxTasks.forEach{ b.delete(db.collection("tasks").document(it.id))}; b.commit(); pendingAll=false }, modifier=Modifier.background(BrutalBlack).border(3.dp, BrutalBlack)){ Text("DELETE ALL ✕", color=BrutalYellow, fontWeight=FontWeight.Black)} }, dismissButton={ TextButton(onClick={pendingAll=false}){ Text("CANCEL")} }, containerColor=BrutalWhite, shape=BrutalRect)
            }
        }
    }

    @Composable fun UpcomingScreen(tasks: List<Task>, anims: BrutalAnimations){
        var pendingDelete by remember{ mutableStateOf<Task?>(null) }
        var pendingAll by remember{ mutableStateOf(false) }
        val upcoming = tasks.filter{ it.scheduledDate!=null && it.status=="active" }.sortedBy{ it.scheduledDate }
        Box(Modifier.fillMaxSize()){
            BrutalHashOverlay(opacity=0.04f)
            LazyColumn(Modifier.fillMaxSize().padding(12.dp), verticalArrangement=Arrangement.spacedBy(10.dp)){
                item{
                    Box(Modifier.fillMaxWidth().shadow(6.dp, shape=BrutalRect).background(BrutalWhite).border(4.dp, BrutalBlack).padding(12.dp)){
                        Row(verticalAlignment=Alignment.CenterVertically){
                            Box(Modifier.size(48.dp).background(BrutalCyan).border(4.dp, BrutalBlack).rotate(1f), contentAlignment=Alignment.Center){ Icon(Icons.Default.CalendarToday, null, tint=BrutalBlack, modifier=Modifier.size(24.dp)) }
                            Spacer(Modifier.width(12.dp))
                            Column{ Text("UPCOMING", fontFamily=SyneFamily, fontWeight=FontWeight.Black, fontSize=24.sp); Box(Modifier.background(BrutalBlack).padding(horizontal=6.dp, vertical=2.dp)){ Text("${upcoming.size} SCHEDULED", fontFamily=JetBrainsMono, fontSize=10.sp, fontWeight=FontWeight.Black, color=BrutalYellow) } }
                        }
                    }
                }
                item{ Box(Modifier.fillMaxWidth().height(28.dp).background(BrutalBlack).border(3.dp, BrutalBlack), contentAlignment=Alignment.Center){ Text("◆ UPCOMING — THE FUTURE IS CONCRETE — PLAN HARD —", fontFamily=JetBrainsMono, fontSize=10.sp, fontWeight=FontWeight.Black, color=BrutalYellow) } }
                if(upcoming.isNotEmpty()){
                    item{ Box(Modifier.fillMaxWidth(), contentAlignment=Alignment.CenterEnd){ Box(Modifier.background(BrutalRed).border(3.dp, BrutalBlack).padding(horizontal=8.dp, vertical=4.dp).clickable{ pendingAll=true }){ Text("DELETE ALL ✕", fontFamily=JetBrainsMono, fontSize=10.sp, fontWeight=FontWeight.Black, color=BrutalWhite) } } }
                }
                if(upcoming.isEmpty()){
                    item{ Box(Modifier.fillMaxWidth().shadow(6.dp, shape=BrutalRect).background(BrutalWhite).border(4.dp, BrutalBlack).padding(24.dp), contentAlignment=Alignment.Center){
                        Column(horizontalAlignment=Alignment.CenterHorizontally){ Box(Modifier.size(64.dp).background(BrutalCyan).border(4.dp, BrutalBlack), contentAlignment=Alignment.Center){ Icon(Icons.Default.CalendarToday, null, tint=BrutalBlack, modifier=Modifier.size(28.dp)) }; Text("NO UPCOMING SLABS", fontFamily=SyneFamily, fontWeight=FontWeight.Black, fontSize=18.sp); Text("THE HORIZON IS CLEAR — GO BUILD", fontFamily=JetBrainsMono, fontSize=10.sp, fontWeight=FontWeight.Black, color=BrutalBlack.copy(0.5f)) }
                    }}
                } else {
                    items(upcoming, key={it.id}){ t -> TaskCardRow(t, anims, onDelete={pendingDelete=it}) }
                }
            }
            pendingDelete?.let{ t ->
                AlertDialog(onDismissRequest={pendingDelete=null}, title={Text("DELETE THIS SLAB?", fontFamily=SyneFamily, fontWeight=FontWeight.Black)}, text={ Box(Modifier.fillMaxWidth().background(BrutalYellow).border(3.dp, BrutalBlack).padding(8.dp)){ Text("\"${t.title}\"", fontFamily=JetBrainsMono, fontWeight=FontWeight.Black)} }, confirmButton={ TextButton(onClick={ db.collection("tasks").document(t.id).delete(); pendingDelete=null }, modifier=Modifier.background(BrutalRed).border(3.dp, BrutalBlack)){ Text("DELETE ✕", color=BrutalWhite, fontWeight=FontWeight.Black)} }, dismissButton={ TextButton(onClick={pendingDelete=null}){ Text("CANCEL", fontWeight=FontWeight.Black)} }, containerColor=BrutalWhite, shape=BrutalRect)
            }
            if(pendingAll){
                AlertDialog(onDismissRequest={pendingAll=false}, title={Text("NUKE ALL ${upcoming.size}?", fontFamily=SyneFamily, fontWeight=FontWeight.Black)}, confirmButton={ TextButton(onClick={ val b=db.batch(); upcoming.forEach{ b.delete(db.collection("tasks").document(it.id))}; b.commit(); pendingAll=false }, modifier=Modifier.background(BrutalBlack).border(3.dp, BrutalBlack)){ Text("DELETE ALL ✕", color=BrutalYellow, fontWeight=FontWeight.Black)} }, dismissButton={ TextButton(onClick={pendingAll=false}){ Text("CANCEL")} }, containerColor=BrutalWhite, shape=BrutalRect)
            }
        }
    }

    @Composable fun ProjectsScreen(projects: List<Project>, tasks: List<Task>, anims: BrutalAnimations){
        var selected by remember{ mutableStateOf<Project?>(null) }
        var showCreate by remember{ mutableStateOf(false) }
        var pendingDeleteProject by remember{ mutableStateOf<Project?>(null) }
        var newName by remember{ mutableStateOf("") }
        var newColor by remember{ mutableStateOf("bg-[#FFE600]") }
        var newIcon by remember{ mutableStateOf("◆") }
        var inlineTitle by remember{ mutableStateOf("") }
        var panelDelete by remember{ mutableStateOf<Task?>(null) }
        val context = LocalContext.current

        fun tasksFor(p: Project) = tasks.filter{ (it.projectId==p.id) || (it.categoryId==p.id) || (it.projectName==p.name) || (it.categoryName==p.name) }

        Box(Modifier.fillMaxSize()){
            BrutalHashOverlay(opacity=0.04f)
            LazyVerticalGrid(columns=GridCells.Fixed(2), modifier=Modifier.fillMaxSize().padding(12.dp), verticalArrangement=Arrangement.spacedBy(12.dp), horizontalArrangement=Arrangement.spacedBy(12.dp)){
                item(span={androidx.compose.foundation.lazy.grid.GridItemSpan(2)}){
                    Box(Modifier.fillMaxWidth().shadow(6.dp, shape=BrutalRect).background(BrutalWhite).border(4.dp, BrutalBlack).padding(12.dp)){
                        Row(verticalAlignment=Alignment.CenterVertically){
                            Box(Modifier.size(48.dp).background(BrutalRed).border(4.dp, BrutalBlack).rotate(-1f), contentAlignment=Alignment.Center){ Icon(Icons.Default.Folder, null, tint=BrutalWhite, modifier=Modifier.size(24.dp)) }
                            Spacer(Modifier.width(12.dp))
                            Column{ Text("PROJECTS", fontFamily=SyneFamily, fontWeight=FontWeight.Black, fontSize=24.sp); Box(Modifier.background(BrutalBlack).padding(horizontal=6.dp, vertical=2.dp)){ Text("${projects.size} BOARDS", fontFamily=JetBrainsMono, fontSize=10.sp, fontWeight=FontWeight.Black, color=BrutalWhite) } }
                            Spacer(Modifier.weight(1f))
                            Box(Modifier.background(BrutalBlack).border(3.dp, BrutalBlack).padding(horizontal=10.dp, vertical=8.dp).clickable{ showCreate=true }, contentAlignment=Alignment.Center){ Text("+ NEW SLAB", fontFamily=JetBrainsMono, fontSize=10.sp, fontWeight=FontWeight.Black, color=BrutalYellow) }
                        }
                    }
                }
                item(span={androidx.compose.foundation.lazy.grid.GridItemSpan(2)}){
                    Box(Modifier.fillMaxWidth().height(28.dp).background(BrutalBlack).border(3.dp, BrutalBlack), contentAlignment=Alignment.Center){ Text("◆ PROJECTS — BUILD IN PUBLIC — STACK YOUR SLABS —", fontFamily=JetBrainsMono, fontSize=10.sp, fontWeight=FontWeight.Black, color=BrutalYellow) }
                }
                if(projects.isEmpty()){
                    item(span={androidx.compose.foundation.lazy.grid.GridItemSpan(2)}){
                        Box(Modifier.fillMaxWidth().shadow(6.dp, shape=BrutalRect).background(BrutalWhite).border(4.dp, BrutalBlack).padding(24.dp), contentAlignment=Alignment.Center){
                            Column(horizontalAlignment=Alignment.CenterHorizontally){
                                Box(Modifier.size(64.dp).background(BrutalRed).border(4.dp, BrutalBlack), contentAlignment=Alignment.Center){ Text("◆", fontSize=28.sp, fontWeight=FontWeight.Black, color=BrutalWhite) }
                                Text("NO PROJECTS YET", fontFamily=SyneFamily, fontWeight=FontWeight.Black, fontSize=18.sp)
                                Text("CREATE YOUR FIRST CONCRETE SLAB", fontFamily=JetBrainsMono, fontSize=10.sp, fontWeight=FontWeight.Black, color=BrutalBlack.copy(0.5f))
                                Spacer(Modifier.height(8.dp))
                                Box(Modifier.fillMaxWidth().height(44.dp).background(BrutalBlack).border(3.dp, BrutalBlack).clickable{ showCreate=true }, contentAlignment=Alignment.Center){ Text("CREATE FIRST SLAB — SLAM IT!", fontFamily=JetBrainsMono, fontWeight=FontWeight.Black, color=BrutalYellow) }
                            }
                        }
                    }
                } else {
                    items(projects, key={it.id}){ p ->
                        val count = tasksFor(p).size
                        val done = tasksFor(p).count{ it.status=="completed" }
                        val pct = if(count==0) 0 else (done*100/count)
                        Box(Modifier.fillMaxWidth().height(160.dp).shadow(6.dp, shape=BrutalRect).background(projectBg(p.color)).border(4.dp, BrutalBlack).clickable{ selected=p }.padding(12.dp)){
                            Column(Modifier.fillMaxSize()){
                                Row(Modifier.fillMaxWidth(), horizontalArrangement=Arrangement.SpaceBetween){
                                    Box(Modifier.size(36.dp).background(BrutalBlack).border(3.dp, BrutalBlack), contentAlignment=Alignment.Center){ Text(p.icon, fontWeight=FontWeight.Black, color=BrutalWhite) }
                                    Box(Modifier.background(BrutalWhite).border(3.dp, BrutalBlack).padding(horizontal=6.dp, vertical=2.dp)){ Text("#${(projects.indexOf(p)+1).toString().padStart(2,'0')}", fontFamily=JetBrainsMono, fontSize=10.sp, fontWeight=FontWeight.Black) }
                                }
                                Spacer(Modifier.weight(1f))
                                Text(p.name, fontFamily=SyneFamily, fontWeight=FontWeight.Black, fontSize=16.sp, maxLines=1, overflow=TextOverflow.Ellipsis)
                                Text("$count TASKS — $done DONE", fontFamily=JetBrainsMono, fontSize=9.sp, fontWeight=FontWeight.Black, modifier=Modifier.background(BrutalBlack).padding(horizontal=4.dp, vertical=2.dp), color=BrutalWhite)
                                Spacer(Modifier.height(6.dp))
                                Box(Modifier.fillMaxWidth().height(8.dp).background(BrutalWhite).border(3.dp, BrutalBlack)){
                                    Box(Modifier.fillMaxHeight().fillMaxWidth(pct/100f).background(BrutalBlack))
                                }
                                Box(Modifier.align(Alignment.End).background(BrutalWhite).border(2.dp, BrutalBlack).padding(horizontal=4.dp, vertical=2.dp).clickable{ pendingDeleteProject=p }){
                                    Icon(Icons.Default.Delete, null, tint=BrutalRed, modifier=Modifier.size(12.dp))
                                }
                            }
                        }
                    }
                    item{
                        Box(Modifier.fillMaxWidth().height(160.dp).background(BrutalWhite).border(4.dp, BrutalBlack).border(3.dp, BrutalBlack).clickable{ showCreate=true }.padding(12.dp), contentAlignment=Alignment.Center){
                            Column(horizontalAlignment=Alignment.CenterHorizontally){
                                Box(Modifier.size(48.dp).background(BrutalBlack).border(4.dp, BrutalBlack), contentAlignment=Alignment.Center){ Icon(Icons.Default.Add, null, tint=BrutalYellow) }
                                Spacer(Modifier.height(6.dp))
                                Text("NEW PROJECT", fontFamily=SyneFamily, fontWeight=FontWeight.Black)
                                Text("SLAM ANOTHER SLAB", fontFamily=JetBrainsMono, fontSize=10.sp, fontWeight=FontWeight.Black, modifier=Modifier.background(BrutalBlack).padding(horizontal=6.dp, vertical=2.dp), color=BrutalWhite)
                            }
                        }
                    }
                }
            }
            // create dialog
            if(showCreate){
                AlertDialog(onDismissRequest={showCreate=false}, title={Text("NAME YOUR SLAB", fontFamily=SyneFamily, fontWeight=FontWeight.Black)}, text={
                    Column(verticalArrangement=Arrangement.spacedBy(8.dp)){
                        TextField(value=newName, onValueChange={newName=it}, placeholder={Text("E.G. WORK...")}, modifier=Modifier.fillMaxWidth().border(3.dp, BrutalBlack), colors=TextFieldDefaults.colors(focusedContainerColor=BrutalWhite, unfocusedContainerColor=BrutalWhite, focusedIndicatorColor=Color.Transparent, unfocusedIndicatorColor=Color.Transparent))
                        Row(horizontalArrangement=Arrangement.spacedBy(6.dp)){
                            listOf(BrutalYellow to "bg-[#FFE600]", BrutalCyan to "bg-[#22D3EE]", BrutalPurple to "bg-[#A78BFA]", BrutalRed to "bg-[#FF3B30]", BrutalGreen to "bg-[#22C55E]", BrutalOrange to "bg-[#FF9A00]").forEach{ (col,str) ->
                                Box(Modifier.weight(1f).height(32.dp).background(col).border(3.dp, BrutalBlack).clickable{ newColor=str })
                            }
                        }
                        Row(horizontalArrangement=Arrangement.spacedBy(6.dp)){
                            listOf("◆","▓","★","●","▲","■").forEach{ ic -> Box(Modifier.size(32.dp).background(if(newIcon==ic) BrutalBlack else BrutalWhite).border(3.dp, BrutalBlack).clickable{ newIcon=ic }, contentAlignment=Alignment.Center){ Text(ic, fontWeight=FontWeight.Black, color=if(newIcon==ic) BrutalYellow else BrutalBlack) } }
                        }
                        Box(Modifier.fillMaxWidth().height(44.dp).background(BrutalBlack).border(3.dp, BrutalBlack).clickable{
                            val name=newName.trim(); if(name.isEmpty()) return@clickable
                            if(projects.any{ it.name.equals(name,true)}){ Toast.makeText(context,"SLAB EXISTS", Toast.LENGTH_SHORT).show(); return@clickable }
                            val u=auth.currentUser?:return@clickable
                            db.collection("projects").add(hashMapOf("userId" to u.uid, "name" to name.uppercase(), "color" to newColor, "icon" to newIcon, "order" to System.currentTimeMillis(), "createdAt" to FieldValue.serverTimestamp(), "updatedAt" to FieldValue.serverTimestamp()))
                            newName=""; showCreate=false
                        }, contentAlignment=Alignment.Center){ Text("CREATE ✦ SLAM!", fontFamily=JetBrainsMono, fontWeight=FontWeight.Black, color=BrutalYellow) }
                    }
                }, confirmButton={}, containerColor=BrutalWhite, shape=BrutalRect)
            }
            pendingDeleteProject?.let{ p ->
                AlertDialog(onDismissRequest={pendingDeleteProject=null}, title={Text("NUKE \"${p.name}\" ?", fontFamily=SyneFamily, fontWeight=FontWeight.Black)}, text={ Text("${tasksFor(p).size} TASKS INSIDE — DELETE PROJECT ONLY, TASKS STAY ORPHANED", fontFamily=JetBrainsMono, fontSize=11.sp, fontWeight=FontWeight.Black)}, confirmButton={ TextButton(onClick={ db.collection("projects").document(p.id).delete(); pendingDeleteProject=null; if(selected?.id==p.id) selected=null }, modifier=Modifier.background(BrutalRed).border(3.dp, BrutalBlack)){ Text("DELETE ✕", color=BrutalWhite, fontWeight=FontWeight.Black)} }, dismissButton={ TextButton(onClick={pendingDeleteProject=null}){ Text("CANCEL")} }, containerColor=BrutalWhite, shape=BrutalRect)
            }
            // detail panel
            selected?.let{ proj ->
                val filtered = tasksFor(proj)
                val activeF = filtered.filter{ it.status=="active" }
                val doneF = filtered.filter{ it.status=="completed" }
                Box(Modifier.fillMaxSize().background(Color.Black.copy(0.6f)).clickable{ selected=null }){
                    Box(Modifier.fillMaxWidth(0.92f).fillMaxHeight(0.88f).align(Alignment.Center).shadow(8.dp, shape=BrutalRect).background(BrutalYellow).border(4.dp, BrutalBlack).clickable(enabled=false){}){
                        Column(Modifier.fillMaxSize()){
                            Box(Modifier.fillMaxWidth().background(projectBg(proj.color)).border(4.dp, BrutalBlack).padding(12.dp)){
                                Row(verticalAlignment=Alignment.CenterVertically){
                                    Box(Modifier.size(48.dp).background(BrutalBlack).border(4.dp, BrutalBlack), contentAlignment=Alignment.Center){ Text(proj.icon, fontWeight=FontWeight.Black, color=BrutalWhite, fontSize=20.sp) }
                                    Spacer(Modifier.width(8.dp))
                                    Column(Modifier.weight(1f)){ Text(proj.name, fontFamily=SyneFamily, fontWeight=FontWeight.Black, fontSize=20.sp); Text("${filtered.size} TASKS — ${activeF.size} ACTIVE / ${doneF.size} DONE", fontFamily=JetBrainsMono, fontSize=10.sp, fontWeight=FontWeight.Black, modifier=Modifier.background(BrutalBlack).padding(horizontal=6.dp, vertical=2.dp), color=BrutalWhite) }
                                    Box(Modifier.size(36.dp).background(BrutalBlack).border(3.dp, BrutalBlack).clickable{ selected=null }, contentAlignment=Alignment.Center){ Icon(Icons.Default.Close, null, tint=BrutalYellow) }
                                }
                                Spacer(Modifier.height(8.dp))
                                Row(Modifier.fillMaxWidth(), verticalAlignment=Alignment.CenterVertically){
                                    TextField(value=inlineTitle, onValueChange={inlineTitle=it}, placeholder={Text("ADD TASK TO THIS SLAB...", fontFamily=JetBrainsMono, fontSize=10.sp, fontWeight=FontWeight.Black)}, modifier=Modifier.weight(1f).border(3.dp, BrutalBlack), colors=TextFieldDefaults.colors(focusedContainerColor=BrutalWhite, unfocusedContainerColor=BrutalWhite, focusedIndicatorColor=Color.Transparent, unfocusedIndicatorColor=Color.Transparent))
                                    Spacer(Modifier.width(6.dp))
                                    Box(Modifier.background(BrutalBlack).border(3.dp, BrutalBlack).padding(horizontal=12.dp, vertical=12.dp).clickable{
                                        val title=inlineTitle.trim(); if(title.isEmpty()) return@clickable
                                        val u=auth.currentUser?:return@clickable
                                        db.collection("tasks").add(hashMapOf("userId" to u.uid, "title" to title, "status" to "active", "scheduledDate" to SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date()), "priority" to "none", "labels" to emptyList<String>(), "attachments" to emptyList<Any>(), "projectId" to proj.id, "projectName" to proj.name, "categoryId" to proj.id, "categoryName" to proj.name, "order" to System.currentTimeMillis(), "createdAt" to FieldValue.serverTimestamp(), "updatedAt" to FieldValue.serverTimestamp()))
                                        inlineTitle=""
                                    }, contentAlignment=Alignment.Center){ Text("ADD +", fontFamily=JetBrainsMono, fontWeight=FontWeight.Black, color=BrutalYellow, fontSize=12.sp) }
                                }
                            }
                            LazyColumn(Modifier.weight(1f).padding(8.dp), verticalArrangement=Arrangement.spacedBy(8.dp)){
                                if(filtered.isEmpty()){
                                    item{ Box(Modifier.fillMaxWidth().background(BrutalWhite).border(4.dp, BrutalBlack).padding(24.dp), contentAlignment=Alignment.Center){
                                        Column(horizontalAlignment=Alignment.CenterHorizontally){ Icon(Icons.Default.Folder, null, tint=BrutalBlack, modifier=Modifier.size(32.dp)); Text("EMPTY SLAB", fontFamily=SyneFamily, fontWeight=FontWeight.Black); Text("NO TASKS IN THIS PROJECT", fontFamily=JetBrainsMono, fontSize=10.sp, fontWeight=FontWeight.Black, color=BrutalBlack.copy(0.5f)) }
                                    }}
                                } else {
                                    if(activeF.isNotEmpty()){
                                        item{ Box(Modifier.background(BrutalBlack).padding(horizontal=8.dp, vertical=4.dp)){ Text("ACTIVE — ${activeF.size}", fontFamily=JetBrainsMono, fontSize=10.sp, fontWeight=FontWeight.Black, color=BrutalYellow)} }
                                        items(activeF, key={it.id}){ t -> TaskCardRow(t, anims, onDelete={panelDelete=it}) }
                                    }
                                    if(doneF.isNotEmpty()){
                                        item{ Spacer(Modifier.height(6.dp)); Box(Modifier.background(BrutalGreen).border(3.dp, BrutalBlack).padding(horizontal=8.dp, vertical=4.dp)){ Text("COMPLETED — ${doneF.size}", fontFamily=JetBrainsMono, fontSize=10.sp, fontWeight=FontWeight.Black)} }
                                        items(doneF, key={it.id}){ t -> TaskCardRow(t, anims, onDelete={panelDelete=it}) }
                                    }
                                }
                            }
                            Box(Modifier.fillMaxWidth().background(BrutalWhite).border(4.dp, BrutalBlack).padding(8.dp)){
                                Row{
                                    Box(Modifier.background(BrutalRed).border(3.dp, BrutalBlack).padding(horizontal=8.dp, vertical=6.dp).clickable{ pendingDeleteProject=proj }, contentAlignment=Alignment.Center){ Text("DELETE PROJECT", fontFamily=JetBrainsMono, fontSize=10.sp, fontWeight=FontWeight.Black, color=BrutalWhite) }
                                    Spacer(Modifier.weight(1f))
                                    Box(Modifier.background(BrutalBlack).border(3.dp, BrutalBlack).padding(horizontal=12.dp, vertical=6.dp).clickable{ selected=null }, contentAlignment=Alignment.Center){ Text("CLOSE ✕", fontFamily=JetBrainsMono, fontSize=10.sp, fontWeight=FontWeight.Black, color=BrutalYellow) }
                                }
                            }
                        }
                    }
                }
                panelDelete?.let{ t ->
                    AlertDialog(onDismissRequest={panelDelete=null}, title={Text("DELETE THIS SLAB?", fontFamily=SyneFamily, fontWeight=FontWeight.Black)}, text={ Box(Modifier.fillMaxWidth().background(BrutalYellow).border(3.dp, BrutalBlack).padding(8.dp)){ Text("\"${t.title}\"", fontFamily=JetBrainsMono, fontWeight=FontWeight.Black)} }, confirmButton={ TextButton(onClick={ db.collection("tasks").document(t.id).delete(); panelDelete=null }, modifier=Modifier.background(BrutalRed).border(3.dp, BrutalBlack)){ Text("DELETE ✕", color=BrutalWhite, fontWeight=FontWeight.Black)} }, dismissButton={ TextButton(onClick={panelDelete=null}){ Text("CANCEL")} }, containerColor=BrutalWhite, shape=BrutalRect)
                }
            }
        }
    }

    @Composable fun SettingsScreen(isDark: Boolean, onToggleDark: ()->Unit, accentStr: String, onAccentChange: (String)->Unit){
        var pushEnabled by remember{ mutableStateOf(false) }
        val user = auth.currentUser
        val accentColor = when(accentStr){
            "#22D3EE" -> BrutalCyan
            "#A78BFA" -> BrutalPurple
            else -> BrutalYellow
        }
        Box(Modifier.fillMaxSize()){
            BrutalHashOverlay(opacity=0.04f)
            LazyColumn(Modifier.fillMaxSize().padding(12.dp), verticalArrangement=Arrangement.spacedBy(12.dp)){
                item{
                    Box(Modifier.fillMaxWidth().shadow(6.dp, shape=BrutalRect).background(BrutalWhite).border(4.dp, BrutalBlack).padding(12.dp)){
                        Row(verticalAlignment=Alignment.CenterVertically){
                            Box(Modifier.size(48.dp).background(BrutalBlack).border(4.dp, BrutalBlack), contentAlignment=Alignment.Center){ Icon(Icons.Default.Settings, null, tint=BrutalYellow, modifier=Modifier.size(24.dp)) }
                            Spacer(Modifier.width(12.dp))
                            Column{ Text("SETTINGS", fontFamily=SyneFamily, fontWeight=FontWeight.Black, fontSize=24.sp); Box(Modifier.background(BrutalYellow).border(3.dp, BrutalBlack).padding(horizontal=6.dp, vertical=2.dp)){ Text("CONTROL PANEL", fontFamily=JetBrainsMono, fontSize=10.sp, fontWeight=FontWeight.Black) } }
                        }
                    }
                }
                item{
                    Box(Modifier.fillMaxWidth().shadow(6.dp, shape=BrutalRect).background(BrutalWhite).border(4.dp, BrutalBlack).padding(12.dp)){
                        Column{
                            Row(verticalAlignment=Alignment.CenterVertically){ Box(Modifier.size(28.dp).background(BrutalYellow).border(3.dp, BrutalBlack), contentAlignment=Alignment.Center){ Icon(Icons.Default.Person, null, tint=BrutalBlack, modifier=Modifier.size(16.dp)) }; Spacer(Modifier.width(8.dp)); Text("ACCOUNT — WHO ARE YOU?", fontFamily=SyneFamily, fontWeight=FontWeight.Black, fontSize=14.sp) }
                            Spacer(Modifier.height(8.dp))
                            Box(Modifier.fillMaxWidth().background(BrutalYellow).border(4.dp, BrutalBlack).padding(12.dp)){
                                Text("SIGNED IN AS:", fontFamily=JetBrainsMono, fontSize=10.sp, fontWeight=FontWeight.Black)
                                Spacer(Modifier.height(4.dp))
                                Box(Modifier.background(BrutalBlack).border(3.dp, BrutalBlack).padding(horizontal=8.dp, vertical=6.dp)){ Text(user?.email ?: user?.phoneNumber ?: "UNKNOWN", fontFamily=JetBrainsMono, fontWeight=FontWeight.Black, color=BrutalWhite, fontSize=12.sp) }
                            }
                            Spacer(Modifier.height(8.dp))
                            Box(Modifier.fillMaxWidth().height(44.dp).background(BrutalRed).border(4.dp, BrutalBlack).clickable{ auth.signOut() }, contentAlignment=Alignment.Center){
                                Text("LOG OUT — EXIT VOID", fontFamily=JetBrainsMono, fontWeight=FontWeight.Black, color=BrutalWhite)
                            }
                        }
                    }
                }
                item{
                    Box(Modifier.fillMaxWidth().shadow(6.dp, shape=BrutalRect).background(BrutalWhite).border(4.dp, BrutalBlack).padding(12.dp)){
                        Column{
                            Row(verticalAlignment=Alignment.CenterVertically){ Box(Modifier.size(28.dp).background(BrutalPurple).border(3.dp, BrutalBlack), contentAlignment=Alignment.Center){ Icon(Icons.Default.DarkMode, null, tint=BrutalBlack, modifier=Modifier.size(16.dp)) }; Spacer(Modifier.width(8.dp)); Text("APPEARANCE — LOOK BRUTAL", fontFamily=SyneFamily, fontWeight=FontWeight.Black, fontSize=14.sp) }
                            Spacer(Modifier.height(8.dp))
                            Box(Modifier.fillMaxWidth().background(if(isDark) BrutalBlack else BrutalWhite).border(4.dp, BrutalBlack).padding(12.dp).clickable{ onToggleDark() }){
                                Row(Modifier.fillMaxWidth(), horizontalArrangement=Arrangement.SpaceBetween, verticalAlignment=Alignment.CenterVertically){
                                    Text("BRUTAL MODE // DARK UI? (LIGHT FIXED)", fontFamily=JetBrainsMono, fontWeight=FontWeight.Black, color=if(isDark) BrutalWhite else BrutalBlack, fontSize=11.sp)
                                    Box(Modifier.size(48.dp).background(if(isDark) BrutalYellow else BrutalWhite).border(3.dp, BrutalBlack), contentAlignment=Alignment.Center){ Text(if(isDark) "ON" else "OFF", fontFamily=JetBrainsMono, fontWeight=FontWeight.Black, fontSize=10.sp) }
                                }
                            }
                            Spacer(Modifier.height(8.dp))
                            Row(horizontalArrangement=Arrangement.spacedBy(8.dp), modifier=Modifier.fillMaxWidth()){
                                listOf(BrutalYellow to "#FFE600", BrutalCyan to "#22D3EE", BrutalPurple to "#A78BFA").forEach{ (col, hex) ->
                                    val isSelected = accentStr == hex
                                    Box(Modifier.weight(1f).height(44.dp).background(col).border(4.dp, BrutalBlack).clickable{ onAccentChange(hex) }.padding(4.dp), contentAlignment=Alignment.Center){
                                        Text(hex, fontFamily=JetBrainsMono, fontWeight=FontWeight.Black, fontSize=9.sp, color=BrutalBlack)
                                        if(isSelected) Box(Modifier.align(Alignment.TopEnd).background(BrutalBlack).padding(horizontal=4.dp, vertical=2.dp)){ Text("ON", fontSize=8.sp, color=BrutalWhite, fontWeight=FontWeight.Black)}
                                    }
                                }
                            }
                            Spacer(Modifier.height(4.dp))
                            Text("ACCENT: $accentStr — TAP A SLAB TO SLAM COLOR • BG WILL USE ACCENT IN LIGHT MODE", fontFamily=JetBrainsMono, fontSize=10.sp, fontWeight=FontWeight.Black, color=BrutalBlack.copy(0.6f))
                        }
                    }
                }
                item{
                    Box(Modifier.fillMaxWidth().shadow(6.dp, shape=BrutalRect).background(BrutalWhite).border(4.dp, BrutalBlack).padding(12.dp)){
                        Column{
                            Row(verticalAlignment=Alignment.CenterVertically){ Box(Modifier.size(28.dp).background(BrutalRed).border(3.dp, BrutalBlack), contentAlignment=Alignment.Center){ Icon(Icons.Default.Notifications, null, tint=BrutalWhite, modifier=Modifier.size(16.dp)) }; Spacer(Modifier.width(8.dp)); Text("NOTIFICATIONS — STAY LOUD", fontFamily=SyneFamily, fontWeight=FontWeight.Black, fontSize=14.sp) }
                            Spacer(Modifier.height(8.dp))
                            Box(Modifier.fillMaxWidth().background(if(pushEnabled) BrutalBlack else BrutalWhite).border(4.dp, BrutalBlack).padding(12.dp).clickable{ pushEnabled=!pushEnabled }){
                                Row(Modifier.fillMaxWidth(), horizontalArrangement=Arrangement.SpaceBetween, verticalAlignment=Alignment.CenterVertically){
                                    Text("ENABLE PUSH REMINDERS", fontFamily=JetBrainsMono, fontWeight=FontWeight.Black, color=if(pushEnabled) BrutalWhite else BrutalBlack, fontSize=12.sp)
                                    Box(Modifier.size(48.dp).background(if(pushEnabled) BrutalYellow else BrutalWhite).border(3.dp, BrutalBlack), contentAlignment=Alignment.Center){ Text(if(pushEnabled) "ON" else "OFF", fontFamily=JetBrainsMono, fontWeight=FontWeight.Black, fontSize=10.sp) }
                                }
                            }
                            Spacer(Modifier.height(4.dp))
                            Text(if(pushEnabled) "LIVE — WE WILL NUDGE YOU BRUTAL" else "OFF — TAP TO ENABLE", fontFamily=JetBrainsMono, fontSize=10.sp, fontWeight=FontWeight.Black, color=BrutalBlack.copy(0.6f))
                        }
                    }
                }
                item{
                    Box(Modifier.fillMaxWidth().background(BrutalBlack).border(4.dp, BrutalBlack).padding(12.dp)){
                        Row(verticalAlignment=Alignment.CenterVertically){
                            Icon(Icons.Default.Storage, null, tint=BrutalYellow, modifier=Modifier.size(20.dp))
                            Spacer(Modifier.width(8.dp))
                            Text("STORAGE: CONCRETE • SYNC: FIREBASE • STYLE: BRUTAL", fontFamily=JetBrainsMono, fontSize=10.sp, fontWeight=FontWeight.Black, color=BrutalYellow)
                            Spacer(Modifier.weight(1f))
                            Icon(Icons.Default.Bolt, null, tint=BrutalYellow, modifier=Modifier.size(20.dp))
                        }
                    }
                }
            }
        }
    }

    private fun isSameDay(date1: Date, date2: Date): Boolean {
        val cal1 = Calendar.getInstance().apply { time = date1 }
        val cal2 = Calendar.getInstance().apply { time = date2 }
        return cal1.get(Calendar.YEAR) == cal2.get(Calendar.YEAR) && cal1.get(Calendar.DAY_OF_YEAR) == cal2.get(Calendar.DAY_OF_YEAR)
    }
}
